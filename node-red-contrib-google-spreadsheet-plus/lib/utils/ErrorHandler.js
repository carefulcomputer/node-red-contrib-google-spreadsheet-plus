/**
 * Centralized error handling utility for Node-RED nodes
 * Provides consistent error handling and user-friendly messages
 */
class ErrorHandler {
    /**
     * Handle an error with consistent logging and status updates
     * @param {Object} node - Node-RED node instance
     * @param {Error} error - The error to handle
     * @param {Object} data - Message object to send to error output
     * @param {Object} nodeStatus - NodeStatus instance for status updates
     */
    static handle(node, error, data, nodeStatus) {
        const userMessage = ErrorHandler.getUserFriendlyMessage(error);
        
        node.error(userMessage, data);
        
        if (nodeStatus) {
            nodeStatus.setError('Error');
        }
        
        // Send to error output (second output)
        node.send([undefined, data]);
    }
    
    /**
     * Convert technical error to user-friendly message
     * @param {Error} error - The error to convert
     * @returns {string} User-friendly error message
     */
    static getUserFriendlyMessage(error) {
        const message = error.message || String(error);
        
        // Map common Google API errors to user-friendly messages
        if (message.includes('invalid_grant')) {
            return 'Authentication failed: Invalid or expired credentials. Please check your service account credentials.';
        }
        
        if (message.includes('403') || message.includes('PERMISSION_DENIED')) {
            return 'Permission denied: Check that the service account has access to this spreadsheet.';
        }
        
        if (message.includes('404') || message.includes('NOT_FOUND')) {
            return 'Spreadsheet not found: Check the spreadsheet ID and ensure it exists.';
        }
        
        if (message.includes('429') || message.includes('RATE_LIMIT')) {
            return 'Rate limit exceeded: Too many requests. Please slow down your operations.';
        }
        
        if (message.includes('Invalid spreadsheet ID')) {
            return 'Invalid spreadsheet ID format. Please check the ID.';
        }
        
        if (message.includes('Invalid range')) {
            return 'Invalid range format. Use A1 notation (e.g., Sheet1!A1:B10).';
        }
        
        // Return original message if no mapping found
        return `Operation failed: ${message}`;
    }
    
    /**
     * Validate and handle validation errors
     * @param {Object} node - Node-RED node instance
     * @param {Object} validation - Validation result {valid, error/errors}
     * @param {Object} data - Message object
     * @param {Object} nodeStatus - NodeStatus instance
     * @returns {boolean} True if valid, false if invalid (and handled)
     */
    static handleValidation(node, validation, data, nodeStatus) {
        if (!validation.valid) {
            const errorMessage = validation.error || validation.errors.join('\n');
            node.error(errorMessage, data);
            
            if (nodeStatus) {
                nodeStatus.set('VALIDATION_ERROR');
            }
            
            node.send([undefined, data]);
            return false;
        }
        return true;
    }
}

module.exports = ErrorHandler;
