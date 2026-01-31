/**
 * Validation utilities for Google Sheets operations
 * Provides validation for spreadsheet IDs, ranges, and other inputs
 */

/**
 * Validate spreadsheet ID format
 * @param {string} spreadsheetId - The spreadsheet ID to validate
 * @returns {{valid: boolean, error: string|null}}
 */
function validateSpreadsheetId(spreadsheetId) {
    if (!spreadsheetId) {
        return { valid: false, error: 'Spreadsheet ID is required' };
    }
    
    if (typeof spreadsheetId !== 'string') {
        return { valid: false, error: 'Spreadsheet ID must be a string' };
    }
    
    // Google Sheets IDs are typically 44 characters long
    // Format: alphanumeric with hyphens and underscores
    const idPattern = /^[a-zA-Z0-9_-]+$/;
    
    if (!idPattern.test(spreadsheetId)) {
        return { valid: false, error: 'Invalid spreadsheet ID format. Should contain only letters, numbers, hyphens, and underscores' };
    }
    
    if (spreadsheetId.length < 20 || spreadsheetId.length > 100) {
        return { valid: false, error: 'Spreadsheet ID length is unusual. Please verify the ID' };
    }
    
    return { valid: true, error: null };
}

/**
 * Validate A1 notation range
 * @param {string} range - The range to validate (e.g., "Sheet1!A1:B10")
 * @returns {{valid: boolean, error: string|null}}
 */
function validateRange(range) {
    if (!range) {
        return { valid: false, error: 'Range is required (at minimum, provide sheet name)' };
    }
    
    if (typeof range !== 'string') {
        return { valid: false, error: 'Range must be a string' };
    }
    
    // Basic validation: should at least have a sheet name or A1 notation
    // Valid formats:
    // - "Sheet1" (entire sheet)
    // - "Sheet1!A1" (single cell)
    // - "Sheet1!A1:B10" (cell range)
    // - "Sheet1!A:D" (column range)
    // - "Sheet1!A:A" (single column)
    // - "Sheet1!1:10" (row range)
    // - "A1:B10" (range on default sheet)
    
    // Pattern to match A1 notation including column/row ranges
    // Matches: A1, A1:B10, A:D, A:A, 1:10, etc.
    const cellPattern = /^([A-Z]+[0-9]+|[A-Z]+:[A-Z]+|[0-9]+:[0-9]+|[A-Z]+[0-9]+:[A-Z]+[0-9]+)$/;
    
    // If it contains !, validate sheet name and cell reference
    if (range.includes('!')) {
        const parts = range.split('!');
        if (parts.length !== 2) {
            return { valid: false, error: 'Invalid range format. Use format: SheetName!A1:B10' };
        }
        
        const [sheetName, cellRange] = parts;
        
        if (!sheetName || sheetName.trim() === '') {
            return { valid: false, error: 'Sheet name cannot be empty' };
        }
        
        // Cell range is optional (can just specify sheet name)
        if (cellRange && cellRange.trim() !== '' && !cellPattern.test(cellRange)) {
            return { valid: false, error: 'Invalid cell range format. Use A1 notation (e.g., A1:B10, A:D, 1:10)' };
        }
    }
    
    return { valid: true, error: null };
}

/**
 * Validate that required fields are present for a given action
 * @param {Object} params - Parameters to validate
 * @param {string} params.action - The action being performed
 * @param {string} params.spreadsheetId - Spreadsheet ID
 * @param {string} params.range - Range
 * @param {*} params.data - Input data (for set action)
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateRequiredFields(params) {
    const errors = [];
    const { action, spreadsheetId, range, data } = params;
    
    // Spreadsheet ID always required
    if (!spreadsheetId) {
        errors.push('Spreadsheet ID is required');
    }
    
    // Range always required
    if (!range) {
        errors.push('Range is required');
    }
    
    // Action-specific validation
    if (action === 'set') {
        if (data === undefined || data === null) {
            errors.push('Input data is required for set operation');
        }
    }
    
    // Cell action requires cell_l and cell_c
    if (action === 'cell') {
        if (!params.cell_l) {
            errors.push('Line/row label is required for cell operation');
        }
        if (!params.cell_c) {
            errors.push('Column label is required for cell operation');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate authentication configuration
 * @param {Object} auth - Authentication configuration node
 * @returns {{valid: boolean, error: string|null}}
 */
function validateAuth(auth) {
    if (!auth) {
        return { valid: false, error: 'Authentication configuration is missing. Please configure a Google Service Account' };
    }
    
    if (typeof auth.authenticate !== 'function') {
        return { valid: false, error: 'Authentication configuration is invalid' };
    }
    
    return { valid: true, error: null };
}

module.exports = {
    validateSpreadsheetId,
    validateRange,
    validateRequiredFields,
    validateAuth
};
