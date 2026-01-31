/**
 * Unit tests for DataTransformer
 * Tests data transformation between different formats
 */

const DataTransformer = require('../../../lib/transformers/DataTransformer');

describe('DataTransformer', () => {
    let transformer;
    
    beforeEach(() => {
        transformer = new DataTransformer();
    });
    
    describe('extractObjectValues', () => {
        test('Extracts simple object', () => {
            const result = transformer.extractObjectValues({ name: 'John', age: 30 });
            expect(result.keys).toEqual(['name', 'age']);
            expect(result.values).toEqual(['John', 30]);
        });
        
        test('Extracts nested object', () => {
            const result = transformer.extractObjectValues({ user: { name: 'John', age: 30 } });
            expect(result.keys).toEqual(['user.name', 'user.age']);
            expect(result.values).toEqual(['John', 30]);
        });
        
        test('Handles arrays as leaf values', () => {
            const result = transformer.extractObjectValues({ items: [1, 2, 3] });
            expect(result.keys).toEqual(['items']);
            expect(result.values).toEqual([[1, 2, 3]]);
        });
        
        test('Handles null values', () => {
            const result = transformer.extractObjectValues({ name: 'John', middle: null });
            expect(result.keys).toEqual(['name', 'middle']);
            expect(result.values).toEqual(['John', null]);
        });
    });
    
    describe('transform - Array of Arrays', () => {
        test('Passes through array of arrays', () => {
            const data = [[1, 2], [3, 4]];
            const result = transformer.transform(data, {});
            expect(result).toEqual([[1, 2], [3, 4]]);
        });
    });
    
    describe('transform - Array of Objects', () => {
        test('Transforms array of objects with all fields', () => {
            const data = [
                { name: 'John', age: 30 },
                { name: 'Jane', age: 25 }
            ];
            const config = { fields: 'all', method: 'append' };
            const result = transformer.transform(data, config);
            expect(result).toEqual([
                ['John', 30],
                ['Jane', 25]
            ]);
        });
        
        test('Adds headers when method is new and line is true', () => {
            const data = [{ name: 'John', age: 30 }];
            const config = { fields: 'all', method: 'new', line: true };
            const result = transformer.transform(data, config);
            expect(result).toEqual([
                ['name', 'age'],
                ['John', 30]
            ]);
        });
        
        test('Transforms array of objects with selected fields', () => {
            const data = [
                { name: 'John', age: 30, city: 'NYC' },
                { name: 'Jane', age: 25, city: 'LA' }
            ];
            const config = { selfields: ['name', 'city'] };
            const result = transformer.transform(data, config);
            expect(result).toEqual([
                ['John', 'NYC'],
                ['Jane', 'LA']
            ]);
        });
        
        test('Adds headers with selected fields', () => {
            const data = [{ name: 'John', age: 30 }];
            const config = { selfields: ['name', 'age'], method: 'new', line: true };
            const result = transformer.transform(data, config);
            expect(result).toEqual([
                ['name', 'age'],
                ['John', 30]
            ]);
        });
    });
    
    describe('transform - Object of Objects', () => {
        test('Transforms object of objects with all fields', () => {
            const data = {
                user1: { name: 'John', age: 30 },
                user2: { name: 'Jane', age: 25 }
            };
            const config = { fields: 'all', method: 'append' };
            const result = transformer.transform(data, config);
            expect(result.length).toBe(2);
            expect(result[0]).toContain('John');
            expect(result[1]).toContain('Jane');
        });
        
        test('Adds line and column headers', () => {
            const data = {
                user1: { name: 'John', age: 30 }
            };
            const config = { fields: 'all', method: 'new', line: true, column: true };
            const result = transformer.transform(data, config);
            expect(result[0][0]).toBe('Elements');
            expect(result[0]).toContain('name');
            expect(result[0]).toContain('age');
            expect(result[1][0]).toBe('user1');
        });
        
        test('Adds column headers without line headers', () => {
            const data = {
                user1: { name: 'John', age: 30 }
            };
            const config = { fields: 'all', method: 'new', column: true };
            const result = transformer.transform(data, config);
            expect(result[0][0]).toBe('user1');
        });
        
        test('Transforms object of objects with selected fields', () => {
            const data = {
                user1: { name: 'John', age: 30, city: 'NYC' },
                user2: { name: 'Jane', age: 25, city: 'LA' }
            };
            const config = { selfields: ['name', 'city'], method: 'append' };
            const result = transformer.transform(data, config);
            expect(result.length).toBe(2);
            expect(result[0]).toEqual(['John', 'NYC']);
            expect(result[1]).toEqual(['Jane', 'LA']);
        });
        
        test('Adds line headers with selected fields', () => {
            const data = {
                user1: { name: 'John', age: 30 }
            };
            const config = { selfields: ['name', 'age'], method: 'new', line: true };
            const result = transformer.transform(data, config);
            expect(result[0]).toEqual(['name', 'age']);
            expect(result[1]).toEqual(['John', 30]);
        });
        
        test('Adds column headers with selected fields', () => {
            const data = {
                user1: { name: 'John' },
                user2: { name: 'Jane' }
            };
            const config = { selfields: ['name'], method: 'new', column: true };
            const result = transformer.transform(data, config);
            expect(result[0][0]).toBe('user1');
            expect(result[1][0]).toBe('user2');
        });
        
        test('Adds both line and column headers with selected fields', () => {
            const data = {
                user1: { name: 'John' }
            };
            const config = { selfields: ['name'], method: 'new', line: true, column: true };
            const result = transformer.transform(data, config);
            expect(result[0][0]).toBe('Elements');
            expect(result[1][0]).toBe('user1');
        });
    });
    
    describe('transformToObjects', () => {
        test('Returns empty array for empty input', () => {
            const result = transformer.transformToObjects([], ['name', 'age']);
            expect(result).toEqual([]);
        });
        
        test('Returns values unchanged when no fields', () => {
            const values = [[1, 2], [3, 4]];
            const result = transformer.transformToObjects(values, []);
            expect(result).toEqual([[1, 2], [3, 4]]);
        });
        
        test('Transforms values to objects using fields', () => {
            const values = [
                ['John', 30],
                ['Jane', 25]
            ];
            const fields = ['name', 'age'];
            const result = transformer.transformToObjects(values, fields);
            expect(result).toEqual([
                { name: 'John', age: 30 },
                { name: 'Jane', age: 25 }
            ]);
        });
        
        test('Handles nested field names', () => {
            const values = [['John', 'NYC']];
            const fields = ['user.name', 'user.city'];
            const result = transformer.transformToObjects(values, fields);
            expect(result).toEqual([
                { user: { name: 'John', city: 'NYC' } }
            ]);
        });
    });
    
    describe('setNestedProperty', () => {
        test('Sets simple property', () => {
            const obj = {};
            transformer.setNestedProperty(obj, 'name', 'John');
            expect(obj.name).toBe('John');
        });
        
        test('Sets nested property', () => {
            const obj = {};
            transformer.setNestedProperty(obj, 'user.name', 'John');
            expect(obj.user.name).toBe('John');
        });
        
        test('Creates intermediate objects', () => {
            const obj = {};
            transformer.setNestedProperty(obj, 'a.b.c', 'value');
            expect(obj.a.b.c).toBe('value');
        });
    });
    
    describe('addColumnLabels', () => {
        test('Adds column labels without line headers', () => {
            const values = [[1, 2], [3, 4]];
            const labels = ['row1', 'row2'];
            transformer.addColumnLabels(values, labels, false);
            expect(values[0][0]).toBe('row1');
            expect(values[1][0]).toBe('row2');
        });
        
        test('Adds column labels with line headers', () => {
            const values = [['col1', 'col2'], [1, 2], [3, 4]];
            const labels = ['row1', 'row2'];
            transformer.addColumnLabels(values, labels, true);
            expect(values[0][0]).toBe('Elements');
            expect(values[1][0]).toBe('row1');
            expect(values[2][0]).toBe('row2');
        });
    });
    
    describe('copyValuesArray', () => {
        test('Copies array of arrays', () => {
            const input = [[1, 2], [3, 4]];
            const result = transformer.copyValuesArray(input);
            expect(result).toEqual([[1, 2], [3, 4]]);
            expect(result).not.toBe(input);
            expect(result[0]).not.toBe(input[0]);
        });
        
        test('Handles non-array elements', () => {
            const input = [[1, 2], 'string', [3, 4]];
            const result = transformer.copyValuesArray(input);
            expect(result).toEqual([[1, 2], 'string', [3, 4]]);
        });
        
        test('Handles empty array', () => {
            const result = transformer.copyValuesArray([]);
            expect(result).toEqual([]);
        });
        
        test('Creates deep copy', () => {
            const input = [[1, 2, 3]];
            const result = transformer.copyValuesArray(input);
            input[0][0] = 999;
            expect(result[0][0]).toBe(1);
        });
    });
    
    describe('transformGetResponse', () => {
        test('Returns response as-is when no headers', () => {
            const values = [[1, 2], [3, 4]];
            const config = {};
            const result = transformer.transformGetResponse(values, config, 'ROWS');
            expect(result).toEqual([[1, 2], [3, 4]]);
        });
        
        test('Transforms with both line and column headers', () => {
            const values = [['', 'col1', 'col2'], ['row1', 1, 2], ['row2', 3, 4]];
            const config = { line: true, column: true };
            const result = transformer.transformGetResponse(values, config, 'ROWS');
            expect(result).toEqual({
                row1: { col1: 1, col2: 2 },
                row2: { col1: 3, col2: 4 }
            });
        });
        
        test('Transforms with single column header (COLUMNS)', () => {
            const values = [['key1', 1, 2], ['key2', 3, 4]];
            const config = { column: true, direction: 'column' };
            const result = transformer.transformGetResponse(values, config, 'COLUMNS');
            expect(result).toEqual({
                key1: [1, 2],
                key2: [3, 4]
            });
        });
        
        test('Transforms with single line header (ROWS matching)', () => {
            const values = [['row1', 1, 2], ['row2', 3, 4]];
            const config = { line: true, direction: 'line' };
            const result = transformer.transformGetResponse(values, config, 'ROWS');
            expect(result).toEqual({
                row1: [1, 2],
                row2: [3, 4]
            });
        });
        
        test('Transforms to object array when direction mismatched', () => {
            const values = [['name', 'age'], ['John', 30], ['Jane', 25]];
            const config = { line: true };
            const result = transformer.transformGetResponse(values, config, 'COLUMNS');
            expect(result).toEqual([
                { name: 'John', age: 30 },
                { name: 'Jane', age: 25 }
            ]);
        });
        
        test('Transforms with column header when direction is column', () => {
            const values = [['key1', 'val1'], ['key2', 'val2']];
            const config = { column: true };
            const result = transformer.transformGetResponse(values, config, 'COLUMNS');
            expect(result).toEqual({
                key1: ['val1'],
                key2: ['val2']
            });
        });
    });
    
    describe('transformCellResponse', () => {
        test('Returns cell value when found', () => {
            const values = [['', 'col1', 'col2'], ['row1', 'A', 'B'], ['row2', 'C', 'D']];
            const result = transformer.transformCellResponse(values, 'row2', 'col1');
            expect(result).toBe('C');
        });
        
        test('Returns "Not found" when cell_l not found', () => {
            const values = [['', 'col1'], ['row1', 'A']];
            const result = transformer.transformCellResponse(values, 'row999', 'col1');
            expect(result).toBe('Not found');
        });
        
        test('Returns "Not found" when cell_c not found', () => {
            const values = [['', 'col1'], ['row1', 'A']];
            const result = transformer.transformCellResponse(values, 'row1', 'col999');
            expect(result).toBe('Not found');
        });
        
        test('Returns "Not found" when cell is empty', () => {
            const values = [['', 'col1'], ['row1']];
            const result = transformer.transformCellResponse(values, 'row1', 'col1');
            expect(result).toBe('Not found');
        });
    });
    
    describe('Error handling', () => {
        test('Handles string primitives by wrapping in array', () => {
            const result = transformer.transform('test string', {});
            expect(result).toEqual([['test string']]);
        });
        
        test('Handles number primitives by wrapping in array', () => {
            const result = transformer.transform(123, {});
            expect(result).toEqual([[123]]);
        });
        
        test('Handles empty object as object of objects', () => {
            // Empty object is valid - it's an object of objects with no entries
            const result = transformer.transform({}, { fields: 'all' });
            expect(Array.isArray(result)).toBe(true);
        });
    });
});
