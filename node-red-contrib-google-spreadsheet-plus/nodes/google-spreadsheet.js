const helper = require('../lib/helpers');
const validators = require('../lib/validators');
const GoogleSheetsService = require('../lib/services/GoogleSheetsService');
const CacheService = require('../lib/services/CacheService');
const DataTransformer = require('../lib/transformers/DataTransformer');
const NodeStatus = require('../lib/utils/NodeStatus');
const ErrorHandler = require('../lib/utils/ErrorHandler');

/**
 * Node-RED module for Google Sheets operations
 * Supports get, set, clear, and cell operations with caching
 */
module.exports = function(RED) {
    // Initialize services (shared across all nodes)
    const sheetsService = new GoogleSheetsService();
    const cacheService = new CacheService();
    const dataTransformer = new DataTransformer();
    
    const register = function(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const nodeStatus = new NodeStatus(node);
        
        // Set initial status
        nodeStatus.set('MISSING_CREDENTIAL');
        
        if (config.auth) {
            node.auth = RED.nodes.getNode(config.auth);
            nodeStatus.clear();
        }

        this.on('input', async (data) => {
            try {
                await input(RED, node, data, config, sheetsService, cacheService, dataTransformer, nodeStatus);
            } catch (err) {
                // Build error context
                const spreadsheetId = helper.getContextValue(RED, node, data, config.sheet, config.sheetType);
                const range = helper.getContextValue(RED, node, data, config.range, config.rangeType);
                const serviceAccountEmail = node.auth && node.auth.credentials ? node.auth.credentials.client_email : null;
                
                const context = {
                    operation: config.action || 'set',
                    range,
                    spreadsheetId,
                    serviceAccountEmail
                };
                
                ErrorHandler.handle(node, err, data, nodeStatus, context);
            }
        });
    };
    
    RED.nodes.registerType("google-spreadsheet", register, {});
};

/**
 * Main input handler for spreadsheet operations
 */
async function input(RED, node, data, config, sheetsService, cacheService, dataTransformer, nodeStatus) {
    nodeStatus.set('VALIDATING');
    
    const action = config.action || 'set';
    const save = config.save || '_sheet';

    // Validate authentication
    const authValidation = validators.validateAuth(node.auth);
    if (!ErrorHandler.handleValidation(node, authValidation, data, nodeStatus)) {
        nodeStatus.set('AUTH_ERROR');
        return;
    }

    const spreadsheetId = helper.getContextValue(RED, node, data, config.sheet, config.sheetType);
    const range = helper.getContextValue(RED, node, data, config.range, config.rangeType);
    
    // Validate spreadsheet ID
    const idValidation = validators.validateSpreadsheetId(spreadsheetId);
    if (!ErrorHandler.handleValidation(node, idValidation, data, nodeStatus)) {
        nodeStatus.set('INVALID_ID');
        return;
    }
    
    // Validate range
    const rangeValidation = validators.validateRange(range);
    if (!ErrorHandler.handleValidation(node, rangeValidation, data, nodeStatus)) {
        nodeStatus.set('INVALID_RANGE');
        return;
    }
    
    const saveField = range.replace(/[!:'" ]/g, "_");

    const saveLoc = helper.getContextValue(RED, node, data, save, config.saveType) || {};
    helper.setContextValue(RED, node, data, save, saveLoc, config.saveType);

    // Validate action-specific requirements
    const inputData = action === 'set' ? helper.getContextValue(RED, node, data, config.input || "payload", config.inputType) : null;
    
    const requiredValidation = validators.validateRequiredFields({
        action,
        spreadsheetId,
        range,
        data: inputData,
        inputField: config.input || 'payload'
    });
    
    if (!ErrorHandler.handleValidation(node, requiredValidation, data, nodeStatus)) {
        return;
    }

    const parameters = { spreadsheetId, range };
    const method = config.method || 'append';

    nodeStatus.set('PROCESSING');

    try {
        // Authenticate and get auth client (uses cached token if valid, auto-refreshes when needed)
        const auth = await node.auth.authenticate();
        
        // Execute appropriate action
        if (action === "clear" || (action === "set" && config.method === "new")) {
            await queryClear(RED, auth, node, data, config, parameters, saveLoc, saveField, action, method, sheetsService, cacheService, dataTransformer);
        } else if (action === "get") {
            await queryGet(RED, auth, node, data, config, parameters, saveLoc, saveField, sheetsService, cacheService, dataTransformer);
        } else if (action === "set") {
            await querySet(RED, auth, node, data, config, parameters, method, sheetsService, dataTransformer);
        }
        
        nodeStatus.set('SUCCESS');
    } catch (err) {
        throw new Error(`Spreadsheet operation failed: ${err.message}`);
    }
}

/**
 * Set data to spreadsheet (append, update, or new)
 */
async function querySet(RED, auth, node, data, config, parameters, method, sheetsService, dataTransformer) {
    // Get input data
    const rows = helper.getContextValue(RED, node, data, config.input || "payload", config.inputType);

    // Check if data exists (allow primitives, arrays, and objects)
    if (rows === null || rows === undefined || (Array.isArray(rows) && rows.length === 0)) {
        node.error("Input data is empty");
        return node.send([undefined, data]);
    }

    // Transform data to spreadsheet format
    const transformConfig = {
        fields: config.fields,
        selfields: config.selfields,
        method: config.method || method,
        line: config.line,
        column: config.column
    };
    
    const values = dataTransformer.transform(rows, transformConfig);

    // Send to Google Sheets via service
    const responseData = await sheetsService.setValues(
        auth,
        parameters.spreadsheetId,
        parameters.range,
        values,
        method
    );

    // Handle output
    if (config.output) {
        // Always set the response data to output
        helper.setContextValue(RED, node, data, config.output, responseData, config.outputType);
    }
    node.send([data, undefined]);
}

/**
 * Clear data from spreadsheet
 */
async function queryClear(RED, auth, node, data, config, parameters, saveLoc, saveField, action, method, sheetsService, cacheService, dataTransformer) {
    // Clear values via service
    const responseData = await sheetsService.clearValues(auth, parameters.spreadsheetId, parameters.range);

    if (action === "clear") {
        helper.setContextValue(RED, node, data, config.output || "payload", responseData, config.outputType);
        cacheService.invalidate(saveLoc, saveField);
        return node.send([data, undefined]);
    } else {
        // After clearing, set new values
        return querySet(RED, auth, node, data, config, parameters, method, sheetsService, dataTransformer);
    }
}

/**
 * Get data from spreadsheet
 */
async function queryGet(RED, auth, node, data, config, parameters, saveLoc, saveField, sheetsService, cacheService, dataTransformer) {
    // Check cache first
    if (cacheService.has(saveLoc, saveField)) {
        const cachedValues = cacheService.get(saveLoc, saveField);
        const transformedData = dataTransformer.transformGetResponse(cachedValues, config, false);
        helper.setContextValue(RED, node, data, config.output || "payload", transformedData, config.outputType);
        return node.send([data, undefined]);
    }

    // Get values via service
    const majorDimension = (config.direction === "column") ? "COLUMNS" : "ROWS";
    const responseData = await sheetsService.getValues(
        auth,
        parameters.spreadsheetId,
        parameters.range,
        { majorDimension }
    );

    if (!responseData.values) {
        helper.setContextValue(RED, node, data, config.output || "payload", "", config.outputType);
        return node.send([data, undefined]);
    }

    // Cache the results
    const result = dataTransformer.copyValuesArray(responseData.values);
    cacheService.set(saveLoc, saveField, result);

    // Transform and return
    const transformedData = dataTransformer.transformGetResponse(responseData.values, config, responseData.majorDimension);
    helper.setContextValue(RED, node, data, config.output || "payload", transformedData, config.outputType);
    return node.send([data, undefined]);
}
