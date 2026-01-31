/**
 * Additional tests for enhanced error handling in GoogleSheetsService
 */
const GoogleSheetsService = require('../../../lib/services/GoogleSheetsService');

describe('GoogleSheetsService - Enhanced Error Handling', () => {
    let service;
    let mockAuth;

    beforeEach(() => {
        service = new GoogleSheetsService();
        mockAuth = {};
    });

    describe('_enhanceError', () => {
        it('should enhance error with operation context', () => {
            const originalError = new Error('API Error');
            const enhanced = service._enhanceError(originalError, 'get', 'ABC123', 'Sheet1!A1:B10');

            expect(enhanced.message).toBe('API Error');
            expect(enhanced.operation).toBe('get');
            expect(enhanced.spreadsheetId).toBe('ABC123');
            expect(enhanced.range).toBe('Sheet1!A1:B10');
        });

        it('should preserve error code if available', () => {
            const originalError = new Error('API Error');
            originalError.code = 'ERR_NETWORK';
            const enhanced = service._enhanceError(originalError, 'set', 'ABC123', 'Sheet1');

            expect(enhanced.code).toBe('ERR_NETWORK');
        });

        it('should extract status code from response', () => {
            const originalError = new Error('API Error');
            originalError.response = {
                status: 403
            };
            const enhanced = service._enhanceError(originalError, 'get', 'ABC123', 'Sheet1');

            expect(enhanced.statusCode).toBe(403);
        });

        it('should extract error details from Google API response', () => {
            const originalError = new Error('Original message');
            originalError.response = {
                status: 403,
                data: {
                    error: {
                        code: 403,
                        status: 'PERMISSION_DENIED',
                        message: 'The caller does not have permission'
                    }
                }
            };
            const enhanced = service._enhanceError(originalError, 'get', 'ABC123', 'Sheet1');

            expect(enhanced.statusCode).toBe(403);
            expect(enhanced.status).toBe('PERMISSION_DENIED');
            expect(enhanced.message).toBe('The caller does not have permission');
        });

        it('should handle error without response data', () => {
            const originalError = new Error('Network Error');
            const enhanced = service._enhanceError(originalError, 'clear', 'ABC123', 'Sheet1');

            expect(enhanced.message).toBe('Network Error');
            expect(enhanced.operation).toBe('clear');
        });

        it('should handle different operations', () => {
            const operations = ['get', 'set', 'clear', 'cell'];
            
            operations.forEach(op => {
                const originalError = new Error('Test error');
                const enhanced = service._enhanceError(originalError, op, 'ABC123', 'Sheet1');
                expect(enhanced.operation).toBe(op);
            });
        });
    });

    describe('Error handling in API methods', () => {
        beforeEach(() => {
            // Mock the sheets client
            service._getSheetsClient = jest.fn().mockReturnValue({
                spreadsheets: {
                    values: {
                        get: jest.fn(),
                        update: jest.fn(),
                        append: jest.fn(),
                        clear: jest.fn()
                    }
                }
            });
        });

        it('should enhance errors from getValues', async () => {
            const sheetsClient = service._getSheetsClient();
            const apiError = new Error('NOT_FOUND: Unable to parse range');
            apiError.response = {
                status: 404,
                data: {
                    error: {
                        code: 404,
                        status: 'NOT_FOUND',
                        message: 'Unable to parse range: Sheet2'
                    }
                }
            };
            sheetsClient.spreadsheets.values.get.mockRejectedValue(apiError);

            await expect(
                service.getValues(mockAuth, 'ABC123', 'Sheet2!A1:B10')
            ).rejects.toMatchObject({
                operation: 'get',
                spreadsheetId: 'ABC123',
                range: 'Sheet2!A1:B10',
                statusCode: 404
            });
        });

        it('should enhance errors from setValues', async () => {
            const sheetsClient = service._getSheetsClient();
            const apiError = new Error('PERMISSION_DENIED');
            apiError.response = {
                status: 403
            };
            sheetsClient.spreadsheets.values.append.mockRejectedValue(apiError);

            await expect(
                service.setValues(mockAuth, 'ABC123', 'Sheet1', [[1, 2, 3]], 'append')
            ).rejects.toMatchObject({
                operation: 'set',
                spreadsheetId: 'ABC123',
                range: 'Sheet1',
                statusCode: 403
            });
        });

        it('should enhance errors from clearValues', async () => {
            const sheetsClient = service._getSheetsClient();
            const apiError = new Error('Rate limit exceeded');
            apiError.response = {
                status: 429,
                data: {
                    error: {
                        code: 429,
                        status: 'RESOURCE_EXHAUSTED',
                        message: 'Quota exceeded'
                    }
                }
            };
            sheetsClient.spreadsheets.values.clear.mockRejectedValue(apiError);

            await expect(
                service.clearValues(mockAuth, 'ABC123', 'Sheet1!A1:B10')
            ).rejects.toMatchObject({
                operation: 'clear',
                statusCode: 429,
                status: 'RESOURCE_EXHAUSTED'
            });
        });

        it('should preserve original error message', async () => {
            const sheetsClient = service._getSheetsClient();
            const apiError = new Error('Custom error message');
            sheetsClient.spreadsheets.values.get.mockRejectedValue(apiError);

            await expect(
                service.getValues(mockAuth, 'ABC123', 'Sheet1')
            ).rejects.toThrow('Custom error message');
        });
    });

    describe('Integration with error context', () => {
        beforeEach(() => {
            service._getSheetsClient = jest.fn().mockReturnValue({
                spreadsheets: {
                    values: {
                        get: jest.fn()
                    }
                }
            });
        });

        it('should provide context for 403 errors', async () => {
            const sheetsClient = service._getSheetsClient();
            const apiError = new Error('PERMISSION_DENIED: The caller does not have permission');
            apiError.response = {
                status: 403,
                data: {
                    error: {
                        code: 403,
                        status: 'PERMISSION_DENIED'
                    }
                }
            };
            sheetsClient.spreadsheets.values.get.mockRejectedValue(apiError);

            try {
                await service.getValues(mockAuth, 'spreadsheet-123', 'TestSheet!A1:B10');
            } catch (error) {
                expect(error.operation).toBe('get');
                expect(error.spreadsheetId).toBe('spreadsheet-123');
                expect(error.range).toBe('TestSheet!A1:B10');
                expect(error.statusCode).toBe(403);
                expect(error.status).toBe('PERMISSION_DENIED');
            }
        });

        it('should provide context for 404 errors', async () => {
            const sheetsClient = service._getSheetsClient();
            const apiError = new Error('NOT_FOUND: Requested entity was not found');
            apiError.response = {
                status: 404
            };
            sheetsClient.spreadsheets.values.get.mockRejectedValue(apiError);

            try {
                await service.getValues(mockAuth, 'bad-id', 'Sheet1');
            } catch (error) {
                expect(error.operation).toBe('get');
                expect(error.spreadsheetId).toBe('bad-id');
                expect(error.statusCode).toBe(404);
            }
        });

        it('should provide context for 429 rate limit errors', async () => {
            const sheetsClient = service._getSheetsClient();
            const apiError = new Error('RESOURCE_EXHAUSTED: Quota exceeded');
            apiError.response = {
                status: 429
            };
            sheetsClient.spreadsheets.values.get.mockRejectedValue(apiError);

            try {
                await service.getValues(mockAuth, 'ABC123', 'Sheet1');
            } catch (error) {
                expect(error.operation).toBe('get');
                expect(error.statusCode).toBe(429);
            }
        });
    });
});
