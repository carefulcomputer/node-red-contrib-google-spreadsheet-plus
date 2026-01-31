/**
 * Unit tests for GoogleSheetsService
 * Tests API abstraction layer for Google Sheets operations
 */

// Mock googleapis before requiring the service
jest.mock('googleapis', () => ({
    google: {
        sheets: jest.fn(() => ({
            spreadsheets: {
                values: {
                    get: jest.fn(),
                    append: jest.fn(),
                    update: jest.fn(),
                    clear: jest.fn()
                }
            }
        }))
    }
}), { virtual: true });

const { google } = require('googleapis');
const GoogleSheetsService = require('../../../lib/services/GoogleSheetsService');

describe('GoogleSheetsService', () => {
    let service;
    let mockAuth;
    let mockSheets;
    
    beforeEach(() => {
        jest.clearAllMocks();
        service = new GoogleSheetsService();
        
        // Create proper mock auth with request method
        mockAuth = {
            authenticate: jest.fn(),
            request: jest.fn(),
            credentials: { access_token: 'mock-token' }
        };
        
        // Setup mock sheets API
        mockSheets = {
            spreadsheets: {
                values: {
                    get: jest.fn(),
                    append: jest.fn(),
                    update: jest.fn(),
                    clear: jest.fn()
                }
            }
        };
        
        google.sheets.mockReturnValue(mockSheets);
    });
    
    describe('getValues', () => {
        test('Throws error when auth is missing', async () => {
            await expect(service.getValues(null, 'id', 'range'))
                .rejects.toThrow('Auth client is required');
        });
        
        test('Throws error when spreadsheetId is missing', async () => {
            await expect(service.getValues(mockAuth, null, 'range'))
                .rejects.toThrow('Spreadsheet ID is required');
        });
        
        test('Throws error when range is missing', async () => {
            await expect(service.getValues(mockAuth, 'id', null))
                .rejects.toThrow('Range is required');
        });
        
        test('Calls API with correct parameters', async () => {
            const mockGet = jest.fn().mockResolvedValue({
                data: { values: [[1, 2], [3, 4]] }
            });
            
            mockSheets.spreadsheets.values.get = mockGet;
            google.sheets.mockReturnValue(mockSheets);
            
            const result = await service.getValues(mockAuth, 'spreadsheet123', 'Sheet1!A1:B2');
            
            expect(google.sheets).toHaveBeenCalledWith({ version: 'v4', auth: mockAuth });
            expect(mockGet).toHaveBeenCalledWith({
                spreadsheetId: 'spreadsheet123',
                range: 'Sheet1!A1:B2',
                majorDimension: 'ROWS'
            });
            expect(result.values).toEqual([[1, 2], [3, 4]]);
        });
        
        test('Handles custom majorDimension', async () => {
            const mockGet = jest.fn().mockResolvedValue({
                data: { values: [[1, 3], [2, 4]] }
            });
            
            mockSheets.spreadsheets.values.get = mockGet;
            google.sheets.mockReturnValue(mockSheets);
            
            await service.getValues(mockAuth, 'id', 'range', { majorDimension: 'COLUMNS' });
            
            expect(mockGet).toHaveBeenCalledWith(
                expect.objectContaining({ majorDimension: 'COLUMNS' })
            );
        });
        
        test('Throws error on API failure', async () => {
            const mockGet = jest.fn().mockRejectedValue(new Error('API Error'));
            
            mockSheets.spreadsheets.values.get = mockGet;
            google.sheets.mockReturnValue(mockSheets);
            
            await expect(service.getValues(mockAuth, 'id', 'range'))
                .rejects.toThrow('API Error');
        });
    });
    
    describe('setValues', () => {
        test('Throws error when auth is missing', async () => {
            await expect(service.setValues(null, 'id', 'range', [[1]]))
                .rejects.toThrow('Auth client is required');
        });
        
        test('Throws error when spreadsheetId is missing', async () => {
            await expect(service.setValues(mockAuth, null, 'range', [[1]]))
                .rejects.toThrow('Spreadsheet ID is required');
        });
        
        test('Throws error when range is missing', async () => {
            await expect(service.setValues(mockAuth, 'id', null, [[1]]))
                .rejects.toThrow('Range is required');
        });
        
        test('Throws error when values is not an array', async () => {
            await expect(service.setValues(mockAuth, 'id', 'range', 'notarray'))
                .rejects.toThrow('Values must be an array');
        });
        
        test('Calls append method by default', async () => {
            const mockAppend = jest.fn().mockResolvedValue({
                data: { updates: { updatedCells: 4 } }
            });
            
            mockSheets.spreadsheets.values.append = mockAppend;
            google.sheets.mockReturnValue(mockSheets);
            
            const values = [[1, 2], [3, 4]];
            await service.setValues(mockAuth, 'id', 'range', values);
            
            expect(mockAppend).toHaveBeenCalledWith({
                spreadsheetId: 'id',
                range: 'range',
                valueInputOption: 'USER_ENTERED',
                resource: { values }
            });
        });
        
        test('Calls update method when method is new', async () => {
            const mockUpdate = jest.fn().mockResolvedValue({
                data: { updates: { updatedCells: 4 } }
            });
            const mockAppend = jest.fn();
            
            mockSheets.spreadsheets.values.update = mockUpdate;
            mockSheets.spreadsheets.values.append = mockAppend;
            google.sheets.mockReturnValue(mockSheets);
            
            const values = [[1, 2]];
            await service.setValues(mockAuth, 'id', 'range', values, 'new');
            
            expect(mockUpdate).toHaveBeenCalled();
            expect(mockAppend).not.toHaveBeenCalled();
        });
        
        test('Calls update method when method is update', async () => {
            const mockUpdate = jest.fn().mockResolvedValue({
                data: { updates: { updatedCells: 4 } }
            });
            
            mockSheets.spreadsheets.values.update = mockUpdate;
            google.sheets.mockReturnValue(mockSheets);
            
            const values = [[1, 2]];
            await service.setValues(mockAuth, 'id', 'range', values, 'update');
            
            expect(mockUpdate).toHaveBeenCalled();
        });
        
        test('Throws error on API failure', async () => {
            const mockAppend = jest.fn().mockRejectedValue(new Error('API Error'));
            
            mockSheets.spreadsheets.values.append = mockAppend;
            google.sheets.mockReturnValue(mockSheets);
            
            await expect(service.setValues(mockAuth, 'id', 'range', [[1]]))
                .rejects.toThrow('API Error');
        });
    });
    
    describe('clearValues', () => {
        test('Throws error when auth is missing', async () => {
            await expect(service.clearValues(null, 'id', 'range'))
                .rejects.toThrow('Auth client is required');
        });
        
        test('Throws error when spreadsheetId is missing', async () => {
            await expect(service.clearValues(mockAuth, null, 'range'))
                .rejects.toThrow('Spreadsheet ID is required');
        });
        
        test('Throws error when range is missing', async () => {
            await expect(service.clearValues(mockAuth, 'id', null))
                .rejects.toThrow('Range is required');
        });
        
        test('Calls clear API with correct parameters', async () => {
            const mockClear = jest.fn().mockResolvedValue({
                data: { clearedRange: 'Sheet1!A1:B2' }
            });
            
            mockSheets.spreadsheets.values.clear = mockClear;
            google.sheets.mockReturnValue(mockSheets);
            
            const result = await service.clearValues(mockAuth, 'id', 'Sheet1!A1:B2');
            
            expect(mockClear).toHaveBeenCalledWith({
                spreadsheetId: 'id',
                range: 'Sheet1!A1:B2'
            });
            expect(result.clearedRange).toBe('Sheet1!A1:B2');
        });
        
        test('Throws error on API failure', async () => {
            const mockClear = jest.fn().mockRejectedValue(new Error('API Error'));
            
            mockSheets.spreadsheets.values.clear = mockClear;
            google.sheets.mockReturnValue(mockSheets);
            
            await expect(service.clearValues(mockAuth, 'id', 'range'))
                .rejects.toThrow('API Error');
        });
    });
});
