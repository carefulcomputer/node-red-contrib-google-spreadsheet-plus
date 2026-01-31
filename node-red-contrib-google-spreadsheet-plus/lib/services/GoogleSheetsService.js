const { google } = require('googleapis');

/**
 * Service class for Google Sheets API operations
 * Provides abstraction layer over googleapis library
 * Handles all direct API interactions with error handling
 */
class GoogleSheetsService {
    /**
     * Get Google Sheets API client
     * @param {Object} auth - Authenticated Google API client
     * @returns {Object} Google Sheets API client
     * @private
     */
    _getSheetsClient(auth) {
        return google.sheets({ version: 'v4', auth });
    }
    
    /**
     * Get values from a spreadsheet range
     * @param {Object} auth - Authenticated Google API client
     * @param {string} spreadsheetId - The spreadsheet ID
     * @param {string} range - The A1 notation range
     * @param {Object} options - Additional options (majorDimension, etc.)
     * @returns {Promise<Object>} Response data from API
     */
    async getValues(auth, spreadsheetId, range, options = {}) {
        if (!auth) throw new Error('Auth client is required');
        if (!spreadsheetId) throw new Error('Spreadsheet ID is required');
        if (!range) throw new Error('Range is required');
        
        const sheets = this._getSheetsClient(auth);
        
        const parameters = {
            spreadsheetId,
            range,
            majorDimension: options.majorDimension || 'ROWS'
        };
        
        try {
            const response = await sheets.spreadsheets.values.get(parameters);
            return response.data;
        } catch (err) {
            throw this._enhanceError(err, 'get', spreadsheetId, range);
        }
    }
    
    /**
     * Set values to a spreadsheet range
     * @param {Object} auth - Authenticated Google API client
     * @param {string} spreadsheetId - The spreadsheet ID
     * @param {string} range - The A1 notation range
     * @param {Array} values - 2D array of values to set
     * @param {string} method - Method: 'append', 'update', or 'new'
     * @returns {Promise<Object>} Response data from API
     */
    async setValues(auth, spreadsheetId, range, values, method = 'append') {
        if (!auth) throw new Error('Auth client is required');
        if (!spreadsheetId) throw new Error('Spreadsheet ID is required');
        if (!range) throw new Error('Range is required');
        if (!Array.isArray(values)) throw new Error('Values must be an array');
        
        const sheets = this._getSheetsClient(auth);
        
        const parameters = {
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            resource: { values }
        };
        
        const apiMethod = (method === 'new') ? 'update' : method;
        
        try {
            const response = await sheets.spreadsheets.values[apiMethod](parameters);
            return response.data;
        } catch (err) {
            throw this._enhanceError(err, 'set', spreadsheetId, range);
        }
    }
    
    /**
     * Clear values from a spreadsheet range
     * @param {Object} auth - Authenticated Google API client
     * @param {string} spreadsheetId - The spreadsheet ID
     * @param {string} range - The A1 notation range
     * @returns {Promise<Object>} Response data from API
     */
    async clearValues(auth, spreadsheetId, range) {
        if (!auth) throw new Error('Auth client is required');
        if (!spreadsheetId) throw new Error('Spreadsheet ID is required');
        if (!range) throw new Error('Range is required');
        
        const sheets = this._getSheetsClient(auth);
        
        const parameters = {
            spreadsheetId,
            range
        };
        
        try {
            const response = await sheets.spreadsheets.values.clear(parameters);
            return response.data;
        } catch (err) {
            throw this._enhanceError(err, 'clear', spreadsheetId, range);
        }
    }
    
    /**
     * Enhance error with Google API details
     * Preserves error code, status, and message from Google API
     * @param {Error} err - Original error from Google API
     * @param {string} operation - Operation being performed
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {string} range - Range being accessed
     * @returns {Error} Enhanced error
     * @private
     */
    _enhanceError(err, operation, spreadsheetId, range) {
        // Extract Google API error details
        const error = new Error(err.message);
        error.operation = operation;
        error.spreadsheetId = spreadsheetId;
        error.range = range;
        
        // Preserve status code if available
        if (err.code) {
            error.code = err.code;
        }
        
        // Extract status code from error response
        if (err.response && err.response.status) {
            error.statusCode = err.response.status;
        }
        
        // Extract error details from response data
        if (err.response && err.response.data && err.response.data.error) {
            const apiError = err.response.data.error;
            if (apiError.code) error.statusCode = apiError.code;
            if (apiError.status) error.status = apiError.status;
            if (apiError.message) error.message = apiError.message;
        }
        
        return error;
    }
}

module.exports = GoogleSheetsService;
