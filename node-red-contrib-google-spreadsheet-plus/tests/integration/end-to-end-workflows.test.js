/**
 * End-to-end workflow integration tests
 * Tests complete data flows through multiple services (mocking only external APIs)
 */

// Mock googleapis
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
const GoogleSheetsService = require('../../lib/services/GoogleSheetsService');
const CacheService = require('../../lib/services/CacheService');
const DataTransformer = require('../../lib/transformers/DataTransformer');

describe('End-to-End Workflow Tests', () => {
    let sheetsService;
    let cacheService;
    let dataTransformer;
    let mockSheetsAPI;
    let mockAuth;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        sheetsService = new GoogleSheetsService();
        cacheService = new CacheService();
        dataTransformer = new DataTransformer();
        
        mockSheetsAPI = {
            spreadsheets: {
                values: {
                    get: jest.fn(),
                    append: jest.fn(),
                    update: jest.fn(),
                    clear: jest.fn()
                }
            }
        };
        
        google.sheets.mockReturnValue(mockSheetsAPI);
        
        // Create a proper mock auth object that googleapis can use
        mockAuth = {
            token: 'mock-token',
            credentials: { access_token: 'mock-token' },
            request: jest.fn()
        };
    });
    
    describe('Complete Write Workflow', () => {
        test('User data → Transform → Validate → API → Success', async () => {
            // User provides data
            const userData = [
                { name: 'Alice', score: 95, grade: 'A' },
                { name: 'Bob', score: 87, grade: 'B' },
                { name: 'Charlie', score: 92, grade: 'A' }
            ];
            
            // Transform for Google Sheets
            const config = { fields: 'all', method: 'new', line: true };
            const transformed = dataTransformer.transform(userData, config);
            
            // Validate transformation produced correct format
            expect(Array.isArray(transformed)).toBe(true);
            expect(transformed[0]).toEqual(['name', 'score', 'grade']); // Headers
            expect(transformed[1]).toEqual(['Alice', 95, 'A']);
            
            // Mock successful API response
            const mockUpdate = jest.fn().mockResolvedValue({
                data: {
                    updates: {
                        updatedCells: 12,
                        updatedRows: 4,
                        updatedColumns: 3
                    }
                }
            });
            
            mockSheetsAPI.spreadsheets.values.update = mockUpdate;
            google.sheets.mockReturnValue(mockSheetsAPI);
            
            // Send to Google Sheets
            const result = await sheetsService.setValues(
                mockAuth,
                '1234567890abc',
                'Students!A1',
                transformed,
                'new'
            );
            
            // Verify success
            expect(result.updates.updatedRows).toBe(4);
            expect(mockUpdate).toHaveBeenCalled();
        });
    });
    
    describe('Complete Read Workflow with Caching', () => {
        test('API → Cache → Multiple reads from cache', async () => {
            const storage = {};
            const cacheKey = 'students_data';
            
            // Mock API response
            mockSheetsAPI.spreadsheets.values.get.mockResolvedValue({
                data: {
                    values: [
                        ['Name', 'Score'],
                        ['Alice', 95],
                        ['Bob', 87]
                    ],
                    majorDimension: 'ROWS'
                }
            });
            
            // Mock API response
            const mockGet = jest.fn().mockResolvedValue({
                data: { values: [['Name', 'Age'], ['Alice', 25], ['Bob', 30]] }
            });
            
            mockSheetsAPI.spreadsheets.values.get = mockGet;
            google.sheets.mockReturnValue(mockSheetsAPI);
            
            // First read: from API
            const response1 = await sheetsService.getValues(mockAuth, 'sheet123', 'A1:B3');
            const values1 = dataTransformer.copyValuesArray(response1.values);
            cacheService.set(storage, cacheKey, values1);
            
            expect(mockGet).toHaveBeenCalledTimes(1);
            
            // Second read: from cache
            let values2;
            if (cacheService.has(storage, cacheKey)) {
                values2 = cacheService.get(storage, cacheKey);
            } else {
                const response = await sheetsService.getValues(mockAuth, 'sheet123', 'A1:B3');
                values2 = response.values;
            }
            
            // Third read: also from cache
            const values3 = cacheService.has(storage, cacheKey) 
                ? cacheService.get(storage, cacheKey)
                : (await sheetsService.getValues(mockAuth, 'sheet123', 'A1:B3')).values;
            
            // Verify API was called only once
            expect(mockSheetsAPI.spreadsheets.values.get).toHaveBeenCalledTimes(1);
            expect(values2).toEqual(values1);
            expect(values3).toEqual(values1);
        });
    });
    
    describe('Update Workflow with Clear', () => {
        test('Clear old → Transform new → Write new', async () => {
            // Step 1: Clear existing data
            const mockClear = jest.fn().mockResolvedValue({
                data: { clearedRange: 'Sheet1!A1:C10' }
            });
            
            mockSheetsAPI.spreadsheets.values.clear = mockClear;
            google.sheets.mockReturnValue(mockSheetsAPI);
            
            await sheetsService.clearValues(mockAuth, 'sheet123', 'Sheet1!A1:C10');
            expect(mockClear).toHaveBeenCalled();
            
            // Step 2: Transform new data
            const newData = [['Header1', 'Header2'], ['New', 'Data']];
            const values = dataTransformer.copyValuesArray(newData);
            
            // Step 3: Write new data
            const mockUpdate = jest.fn().mockResolvedValue({
                data: { updates: { updatedCells: 4 } }
            });
            
            mockSheetsAPI.spreadsheets.values.update = mockUpdate;
            google.sheets.mockReturnValue(mockSheetsAPI);
            
            await sheetsService.setValues(mockAuth, 'sheet123', 'Sheet1!A1', values, 'new');
            
            // Verify both operations completed
            expect(mockClear).toHaveBeenCalledTimes(1);
            expect(mockUpdate).toHaveBeenCalledTimes(1);
        });
    });
    
    describe('Data Format Conversion Workflows', () => {
        test('Array of objects → Spreadsheet → Back to objects', async () => {
            // Start with array of objects
            const original = [
                { name: 'Product A', price: 10.50, stock: 100 },
                { name: 'Product B', price: 20.00, stock: 50 }
            ];
            
            // Transform to spreadsheet format
            const toSheets = dataTransformer.transform(original, { 
                fields: 'all', 
                method: 'new', 
                line: true 
            });
            
            expect(toSheets).toEqual([
                ['name', 'price', 'stock'],
                ['Product A', 10.50, 100],
                ['Product B', 20.00, 50]
            ]);
            
            // Simulate sending to API and getting back
            const mockUpdate = jest.fn().mockResolvedValue({
                data: { updates: { updatedCells: 9 } }
            });
            
            mockSheetsAPI.spreadsheets.values.update = mockUpdate;
            google.sheets.mockReturnValue(mockSheetsAPI);
            
            await sheetsService.setValues(mockAuth, 'sheet123', 'A1', toSheets, 'new');
            
            // Later, get it back
            const mockGet = jest.fn().mockResolvedValue({
                data: { values: toSheets }
            });
            
            mockSheetsAPI.spreadsheets.values.get = mockGet;
            google.sheets.mockReturnValue(mockSheetsAPI);
            
            const response = await sheetsService.getValues(mockAuth, 'sheet123', 'A1:C3');
            
            // Transform back to objects using first row as headers
            const backToObjects = dataTransformer.transformToObjects(
                response.values.slice(1), // Skip header row
                response.values[0] // Use header row as field names
            );
            
            expect(backToObjects).toEqual(original);
        });
    });
});
