/**
 * Unit tests for ErrorHandler utility
 */

const ErrorHandler = require('../../../lib/utils/ErrorHandler');

describe('ErrorHandler', () => {
    let mockNode;
    let mockNodeStatus;
    let mockData;
    
    beforeEach(() => {
        mockNode = {
            error: jest.fn(),
            send: jest.fn()
        };
        mockNodeStatus = {
            setError: jest.fn(),
            set: jest.fn()
        };
        mockData = { payload: 'test' };
    });
    
    describe('handle', () => {
        test('Handles error with node status', () => {
            const error = new Error('Test error');
            ErrorHandler.handle(mockNode, error, mockData, mockNodeStatus);
            
            expect(mockNode.error).toHaveBeenCalled();
            expect(mockNodeStatus.setError).toHaveBeenCalledWith('Error');
            expect(mockNode.send).toHaveBeenCalledWith([undefined, mockData]);
        });
        
        test('Handles error without node status', () => {
            const error = new Error('Test error');
            ErrorHandler.handle(mockNode, error, mockData, null);
            
            expect(mockNode.error).toHaveBeenCalled();
            expect(mockNode.send).toHaveBeenCalledWith([undefined, mockData]);
        });
    });
    
    describe('getUserFriendlyMessage', () => {
        test('Maps invalid_grant error', () => {
            const error = new Error('invalid_grant: Token expired');
            const message = ErrorHandler.getUserFriendlyMessage(error);
            expect(message).toContain('Authentication failed');
            expect(message).toContain('credentials');
        });
        
        test('Maps 403 permission error', () => {
            const error = new Error('Error 403: PERMISSION_DENIED');
            const message = ErrorHandler.getUserFriendlyMessage(error);
            expect(message).toContain('Permission denied');
        });
        
        test('Maps 404 not found error', () => {
            const error = new Error('Error 404: NOT_FOUND');
            const message = ErrorHandler.getUserFriendlyMessage(error);
            expect(message).toContain('not found');
        });
        
        test('Maps 429 rate limit error', () => {
            const error = new Error('Error 429: RATE_LIMIT exceeded');
            const message = ErrorHandler.getUserFriendlyMessage(error);
            expect(message).toContain('Rate limit');
        });
        
        test('Maps invalid spreadsheet ID error', () => {
            const error = new Error('Invalid spreadsheet ID format');
            const message = ErrorHandler.getUserFriendlyMessage(error);
            expect(message).toContain('Invalid spreadsheet ID');
        });
        
        test('Maps invalid range error', () => {
            const error = new Error('Invalid range notation');
            const message = ErrorHandler.getUserFriendlyMessage(error);
            expect(message).toContain('Invalid range');
            expect(message).toContain('A1 notation');
        });
        
        test('Returns generic message for unknown error', () => {
            const error = new Error('Unknown error type');
            const message = ErrorHandler.getUserFriendlyMessage(error);
            expect(message).toContain('Operation failed');
            expect(message).toContain('Unknown error type');
        });
        
        test('Handles non-Error objects', () => {
            const message = ErrorHandler.getUserFriendlyMessage('String error');
            expect(message).toContain('String error');
        });
    });
    
    describe('handleValidation', () => {
        test('Returns true for valid validation', () => {
            const validation = { valid: true };
            const result = ErrorHandler.handleValidation(mockNode, validation, mockData, mockNodeStatus);
            
            expect(result).toBe(true);
            expect(mockNode.error).not.toHaveBeenCalled();
            expect(mockNode.send).not.toHaveBeenCalled();
        });
        
        test('Handles invalid validation with single error', () => {
            const validation = { valid: false, error: 'Invalid input' };
            const result = ErrorHandler.handleValidation(mockNode, validation, mockData, mockNodeStatus);
            
            expect(result).toBe(false);
            expect(mockNode.error).toHaveBeenCalled();
            expect(mockNodeStatus.set).toHaveBeenCalledWith('VALIDATION_ERROR');
            expect(mockNode.send).toHaveBeenCalledWith([undefined, mockData]);
        });
        
        test('Handles invalid validation with multiple errors', () => {
            const validation = { valid: false, errors: ['Error 1', 'Error 2'] };
            const result = ErrorHandler.handleValidation(mockNode, validation, mockData, mockNodeStatus);
            
            expect(result).toBe(false);
            expect(mockNode.error).toHaveBeenCalled();
        });
        
        test('Handles validation without node status', () => {
            const validation = { valid: false, error: 'Invalid' };
            const result = ErrorHandler.handleValidation(mockNode, validation, mockData, null);
            
            expect(result).toBe(false);
            expect(mockNode.error).toHaveBeenCalled();
            expect(mockNode.send).toHaveBeenCalled();
        });
    });
});
