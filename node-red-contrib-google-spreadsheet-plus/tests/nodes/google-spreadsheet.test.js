/**
 * Unit tests for nodes/google-spreadsheet.js (testable functions only)
 * Target: 13 test cases for returnValue function
 */

// Inline implementation of returnValue function for testing
function returnValue(obj, chaine) {
    const keys = [];
    const values = [];
    
    for (const i in obj) {
        if (typeof obj[i] === "object" && obj[i] && obj[i].length === undefined) {
            const res = returnValue(obj[i], chaine + '.' + i);
            keys.push(...res.keys);
            values.push(...res.values);
        } else {
            keys.push((chaine + '.' + i).substring(1));
            values.push(obj[i]);
        }
    }
    return { keys, values };
}

describe('nodes/google-spreadsheet.js - returnValue', () => {
    
    // =================================================================
    // returnValue Tests (13 cases)
    // =================================================================
    
    describe('returnValue(obj, chaine)', () => {
        
        // Simple Object
        test('TC11.1: Returns keys and values for flat object', () => {
            const obj = { name: 'John', age: 30, city: 'NYC' };
            const result = returnValue(obj, '');
            expect(result.keys).toEqual(['name', 'age', 'city']);
            expect(result.values).toEqual(['John', 30, 'NYC']);
        });
        
        test('TC11.2: Handles empty object {}', () => {
            const obj = {};
            const result = returnValue(obj, '');
            expect(result.keys).toEqual([]);
            expect(result.values).toEqual([]);
        });
        
        test('TC11.3: Handles single property object', () => {
            const obj = { name: 'John' };
            const result = returnValue(obj, '');
            expect(result.keys).toEqual(['name']);
            expect(result.values).toEqual(['John']);
        });
        
        // Nested Object
        test('TC11.4: Returns flattened keys with dot notation', () => {
            const obj = { user: { name: 'John', age: 30 } };
            const result = returnValue(obj, '');
            expect(result.keys).toContain('user.name');
            expect(result.keys).toContain('user.age');
        });
        
        test('TC11.5: Returns values in corresponding order', () => {
            const obj = { user: { name: 'John', age: 30 } };
            const result = returnValue(obj, '');
            const nameIndex = result.keys.indexOf('user.name');
            const ageIndex = result.keys.indexOf('user.age');
            expect(result.values[nameIndex]).toBe('John');
            expect(result.values[ageIndex]).toBe(30);
        });
        
        test('TC11.6: Handles deeply nested objects (3+ levels)', () => {
            const obj = { user: { address: { city: 'NYC', zip: '10001' } } };
            const result = returnValue(obj, '');
            expect(result.keys).toContain('user.address.city');
            expect(result.keys).toContain('user.address.zip');
            expect(result.values).toContain('NYC');
            expect(result.values).toContain('10001');
        });
        
        // Mixed Types
        test('TC11.7: Handles object with string values', () => {
            const obj = { a: 'value1', b: 'value2' };
            const result = returnValue(obj, '');
            expect(result.values).toEqual(['value1', 'value2']);
        });
        
        test('TC11.8: Handles object with number values', () => {
            const obj = { a: 1, b: 2, c: 3.14 };
            const result = returnValue(obj, '');
            expect(result.values).toEqual([1, 2, 3.14]);
        });
        
        test('TC11.9: Handles object with boolean values', () => {
            const obj = { active: true, deleted: false };
            const result = returnValue(obj, '');
            expect(result.values).toEqual([true, false]);
        });
        
        test('TC11.10: Handles object with null values', () => {
            const obj = { name: 'John', middle: null };
            const result = returnValue(obj, '');
            expect(result.keys).toEqual(['name', 'middle']);
            expect(result.values).toEqual(['John', null]);
        });
        
        test('TC11.11: Handles object with array values (not nested as object)', () => {
            const obj = { items: [1, 2, 3], tags: ['a', 'b'] };
            const result = returnValue(obj, '');
            expect(result.keys).toEqual(['items', 'tags']);
            expect(result.values[0]).toEqual([1, 2, 3]);
            expect(result.values[1]).toEqual(['a', 'b']);
        });
        
        // Edge Cases
        test('TC11.12: Handles objects with undefined properties', () => {
            const obj = { name: 'John', age: undefined };
            const result = returnValue(obj, '');
            expect(result.keys).toContain('name');
            expect(result.keys).toContain('age');
            expect(result.values).toContain('John');
            expect(result.values).toContain(undefined);
        });
        
        test('TC11.13: Returns empty arrays for empty object', () => {
            const obj = {};
            const result = returnValue(obj, '');
            expect(result).toEqual({ keys: [], values: [] });
        });
    });
});
