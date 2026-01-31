/**
 * Unit tests for lib/validators.js
 * Target: 95%+ coverage with 57 test cases
 */

const validators = require('../../lib/validators');

describe('lib/validators.js', () => {
    
    // =================================================================
    // validateSpreadsheetId Tests (16 cases)
    // =================================================================
    
    describe('validateSpreadsheetId', () => {
        
        // Missing/Invalid Input
        test('TC5.1: Returns error when spreadsheetId is null', () => {
            const result = validators.validateSpreadsheetId(null);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('required');
        });
        
        test('TC5.2: Returns error when spreadsheetId is undefined', () => {
            const result = validators.validateSpreadsheetId(undefined);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('required');
        });
        
        test('TC5.3: Returns error when spreadsheetId is empty string', () => {
            const result = validators.validateSpreadsheetId('');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('required');
        });
        
        test('TC5.4: Returns error when spreadsheetId is number', () => {
            const result = validators.validateSpreadsheetId(123);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('must be a string');
        });
        
        test('TC5.5: Returns error when spreadsheetId is object', () => {
            const result = validators.validateSpreadsheetId({});
            expect(result.valid).toBe(false);
            expect(result.error).toContain('must be a string');
        });
        
        // Format Validation
        test('TC5.6: Returns error for ID with special characters (!@#$%)', () => {
            const result = validators.validateSpreadsheetId('abc!@#$%def');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid spreadsheet ID format');
        });
        
        test('TC5.7: Returns error for ID with spaces', () => {
            const result = validators.validateSpreadsheetId('abc def ghi');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid spreadsheet ID format');
        });
        
        test('TC5.8: Accepts ID with hyphens', () => {
            const result = validators.validateSpreadsheetId('abc-def-ghi-1234567890-xyz-extra-chars'); // 38 chars
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        });
        
        test('TC5.9: Accepts ID with underscores', () => {
            const result = validators.validateSpreadsheetId('abc_def_ghi_1234567890_xyz_extra_chars'); // 38 chars
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        });
        
        test('TC5.10: Accepts alphanumeric ID', () => {
            const result = validators.validateSpreadsheetId('abc123DEF456xyz789012EXTRA1234'); // 32 chars
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        });
        
        // Length Validation
        test('TC5.11: Returns error for ID with length < 20', () => {
            const result = validators.validateSpreadsheetId('short');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Spreadsheet ID length is unusual');
        });
        
        test('TC5.12: Returns error for ID with length > 100', () => {
            const longId = 'a'.repeat(101);
            const result = validators.validateSpreadsheetId(longId);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Spreadsheet ID length is unusual');
        });
        
        test('TC5.13: Accepts ID with length = 20 (boundary)', () => {
            const id = 'a'.repeat(20);
            const result = validators.validateSpreadsheetId(id);
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        });
        
        test('TC5.14: Accepts ID with length = 100 (boundary)', () => {
            const id = 'a'.repeat(100);
            const result = validators.validateSpreadsheetId(id);
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        });
        
        test('TC5.15: Accepts typical 44-character ID', () => {
            const id = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
            const result = validators.validateSpreadsheetId(id);
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        });
        
        // Valid Cases
        test('TC5.16: Returns {valid: true, error: null} for valid ID', () => {
            const id = 'valid-spreadsheet-id-123_abc_extra'; // 35 chars
            const result = validators.validateSpreadsheetId(id);
            expect(result).toEqual({ valid: true, error: null });
        });
    });
    
    // =================================================================
    // validateRange Tests (17 cases)
    // =================================================================
    
    describe('validateRange', () => {
        
        // Missing/Invalid Input
        test('TC6.1: Returns error when range is null', () => {
            const result = validators.validateRange(null);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('required');
        });
        
        test('TC6.2: Returns error when range is undefined', () => {
            const result = validators.validateRange(undefined);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('required');
        });
        
        test('TC6.3: Returns error when range is empty string', () => {
            const result = validators.validateRange('');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('required');
        });
        
        test('TC6.4: Returns error when range is number', () => {
            const result = validators.validateRange(123);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('must be a string');
        });
        
        test('TC6.5: Returns error when range is object', () => {
            const result = validators.validateRange({});
            expect(result.valid).toBe(false);
            expect(result.error).toContain('must be a string');
        });
        
        // Format with Sheet Name (!)
        test('TC6.6: Accepts "Sheet1!A1:B10" format', () => {
            const result = validators.validateRange('Sheet1!A1:B10');
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        });
        
        test('TC6.7: Accepts "Sheet1!A1" (single cell)', () => {
            const result = validators.validateRange('Sheet1!A1');
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        });
        
        test('TC6.8: Accepts "Sheet1" (entire sheet)', () => {
            const result = validators.validateRange('Sheet1');
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        });
        
        test('TC6.9: Accepts sheet name with spaces', () => {
            const result = validators.validateRange('My Sheet!A1');
            expect(result.valid).toBe(true);
        });
        
        test('TC6.9b: Accepts sheet name with spaces when quoted', () => {
            const result = validators.validateRange("'My Sheet'!A1");
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        });
        
        test('TC6.10: Returns error for empty sheet name "!A1"', () => {
            const result = validators.validateRange('!A1');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Sheet name cannot be empty');
        });
        
        test('TC6.11: Returns error for multiple ! separators', () => {
            const result = validators.validateRange('Sheet1!A1!B2');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid range format');
        });
        
        test('TC6.12: Returns error for invalid cell range after !', () => {
            const result = validators.validateRange('Sheet1!invalid');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid cell range');
        });
        
        // Format without Sheet Name
        test('TC6.13: Accepts "A1:B10" format', () => {
            const result = validators.validateRange('A1:B10');
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        });
        
        test('TC6.14: Accepts "A1" single cell', () => {
            const result = validators.validateRange('A1');
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        });
        
        // Edge Cases
        test('TC6.15: Accepts sheet name with numbers "Sheet123!A1"', () => {
            const result = validators.validateRange('Sheet123!A1');
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        });
        
        test('TC6.16: Accepts sheet name with underscores "My_Sheet!A1"', () => {
            const result = validators.validateRange('My_Sheet!A1');
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        });
        
        // Valid Cases
        test('TC6.17: Returns {valid: true, error: null} for all valid formats', () => {
            const result = validators.validateRange('Data!A1:Z100');
            expect(result).toEqual({ valid: true, error: null });
        });
    });
    
    // =================================================================
    // validateRequiredFields Tests (17 cases)
    // =================================================================
    
    describe('validateRequiredFields', () => {
        
        // Common Required Fields
        test('TC7.1: Returns error when spreadsheetId is missing', () => {
            const result = validators.validateRequiredFields({
                action: 'get',
                range: 'A1:B10'
            });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Spreadsheet ID is required');
        });
        
        test('TC7.2: Returns error when range is missing', () => {
            const result = validators.validateRequiredFields({
                action: 'get',
                spreadsheetId: 'abc123'
            });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Range is required');
        });
        
        test('TC7.3: Returns errors for both missing spreadsheetId and range', () => {
            const result = validators.validateRequiredFields({
                action: 'get'
            });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Spreadsheet ID is required');
            expect(result.errors).toContain('Range is required');
            expect(result.errors.length).toBe(2);
        });
        
        // Action: 'cell'
        test('TC7.4: Returns error when cell_l is missing', () => {
            const result = validators.validateRequiredFields({
                action: 'cell',
                spreadsheetId: 'abc123',
                range: 'A1:B10',
                cell_c: 'Column1'
            });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Line/row label is required for cell operation');
        });
        
        test('TC7.5: Returns error when cell_c is missing', () => {
            const result = validators.validateRequiredFields({
                action: 'cell',
                spreadsheetId: 'abc123',
                range: 'A1:B10',
                cell_l: 'Row1'
            });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Column label is required for cell operation');
        });
        
        test('TC7.6: Returns errors for both missing cell_l and cell_c', () => {
            const result = validators.validateRequiredFields({
                action: 'cell',
                spreadsheetId: 'abc123',
                range: 'A1:B10'
            });
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBe(2);
            expect(result.errors).toContain('Line/row label is required for cell operation');
            expect(result.errors).toContain('Column label is required for cell operation');
        });
        
        test('TC7.7: Returns valid when all cell fields present', () => {
            const result = validators.validateRequiredFields({
                action: 'cell',
                spreadsheetId: 'abc123',
                range: 'A1:B10',
                cell_l: 'Row1',
                cell_c: 'Column1'
            });
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        
        // Action: 'set'
        test('TC7.8: Returns error when data is undefined', () => {
            const result = validators.validateRequiredFields({
                action: 'set',
                spreadsheetId: 'abc123',
                range: 'A1:B10',
                data: undefined,
                inputField: 'payload'
            });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Input data is required for set operation');
        });
        
        test('TC7.9: Returns error when data is null', () => {
            const result = validators.validateRequiredFields({
                action: 'set',
                spreadsheetId: 'abc123',
                range: 'A1:B10',
                data: null,
                inputField: 'payload'
            });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Input data is required for set operation');
        });
        
        test('TC7.10: Returns valid when data is empty array []', () => {
            const result = validators.validateRequiredFields({
                action: 'set',
                spreadsheetId: 'abc123',
                range: 'A1:B10',
                data: [],
                inputField: 'payload'
            });
            expect(result.valid).toBe(true);
        });
        
        test('TC7.11: Returns valid when data is 0 (falsy but valid)', () => {
            const result = validators.validateRequiredFields({
                action: 'set',
                spreadsheetId: 'abc123',
                range: 'A1:B10',
                data: 0
            });
            expect(result.valid).toBe(true);
        });
        
        test('TC7.12: Returns valid when data is false (falsy but valid)', () => {
            const result = validators.validateRequiredFields({
                action: 'set',
                spreadsheetId: 'abc123',
                range: 'A1:B10',
                data: false
            });
            expect(result.valid).toBe(true);
        });
        
        test('TC7.13: Returns valid when data is empty string (falsy but valid)', () => {
            const result = validators.validateRequiredFields({
                action: 'set',
                spreadsheetId: 'abc123',
                range: 'A1:B10',
                data: ''
            });
            expect(result.valid).toBe(true);
        });
        
        // Action: 'get'
        test('TC7.14: Returns valid with only spreadsheetId and range', () => {
            const result = validators.validateRequiredFields({
                action: 'get',
                spreadsheetId: 'abc123',
                range: 'A1:B10'
            });
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        
        // Action: 'clear'
        test('TC7.15: Returns valid with only spreadsheetId and range', () => {
            const result = validators.validateRequiredFields({
                action: 'clear',
                spreadsheetId: 'abc123',
                range: 'A1:B10'
            });
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        
        // Multiple Errors
        test('TC7.16: Returns array with all error messages', () => {
            const result = validators.validateRequiredFields({
                action: 'cell'
            });
            expect(result.errors).toBeInstanceOf(Array);
            expect(result.errors.length).toBeGreaterThan(0);
        });
        
        test('TC7.17: Returns {valid: false, errors: [...]} format', () => {
            const result = validators.validateRequiredFields({
                action: 'set'
            });
            expect(result).toHaveProperty('valid');
            expect(result).toHaveProperty('errors');
            expect(typeof result.valid).toBe('boolean');
            expect(Array.isArray(result.errors)).toBe(true);
        });
    });
    
    // =================================================================
    // validateAuth Tests (7 cases)
    // =================================================================
    
    describe('validateAuth', () => {
        
        // Missing Auth
        test('TC8.1: Returns error when auth is null', () => {
            const result = validators.validateAuth(null);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('missing');
        });
        
        test('TC8.2: Returns error when auth is undefined', () => {
            const result = validators.validateAuth(undefined);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('missing');
        });
        
        // Invalid Auth
        test('TC8.3: Returns error when auth.authenticate is not a function', () => {
            const result = validators.validateAuth({ authenticate: 'not a function' });
            expect(result.valid).toBe(false);
            expect(result.error).toContain('invalid');
        });
        
        test('TC8.4: Returns error when auth is empty object {}', () => {
            const result = validators.validateAuth({});
            expect(result.valid).toBe(false);
            expect(result.error).toContain('invalid');
        });
        
        test('TC8.5: Returns error when auth.authenticate is string', () => {
            const result = validators.validateAuth({ authenticate: 'string' });
            expect(result.valid).toBe(false);
            expect(result.error).toContain('invalid');
        });
        
        // Valid Auth
        test('TC8.6: Returns valid when auth has authenticate function', () => {
            const result = validators.validateAuth({ 
                authenticate: jest.fn() 
            });
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        });
        
        test('TC8.7: Returns {valid: true, error: null} for valid auth', () => {
            const result = validators.validateAuth({ 
                authenticate: () => {} 
            });
            expect(result).toEqual({ valid: true, error: null });
        });
    });
});
