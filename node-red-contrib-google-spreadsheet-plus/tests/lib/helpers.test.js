/**
 * Unit tests for lib/helpers.js
 * Target: 95%+ coverage with 60 test cases
 */

const helpers = require('../../lib/helpers');

describe('lib/helpers.js', () => {
    
    // =================================================================
    // getContextValue Tests (24 cases)
    // =================================================================
    
    describe('getContextValue', () => {
        let RED, node, msg, mockContext;
        
        beforeEach(() => {
            mockContext = global.mockNodeContext();
            node = {
                ...global.mockNode(),
                context: jest.fn(() => mockContext)
            };
            RED = global.mockRED();
            msg = { payload: 'test', user: { name: 'John', age: 30 } };
        });
        
        // Edge Cases
        test('TC1.1: Returns undefined when field is null', () => {
            expect(helpers.getContextValue(RED, node, msg, null, 'str')).toBeUndefined();
        });
        
        test('TC1.2: Returns undefined when field is undefined', () => {
            expect(helpers.getContextValue(RED, node, msg, undefined, 'str')).toBeUndefined();
        });
        
        test('TC1.3: Returns undefined when field is empty string', () => {
            expect(helpers.getContextValue(RED, node, msg, '', 'str')).toBeUndefined();
        });
        
        // Type: 'msg'
        test('TC1.4: Returns value from msg.payload', () => {
            expect(helpers.getContextValue(RED, node, msg, 'payload', 'msg')).toBe('test');
        });
        
        test('TC1.5: Returns nested value using dot notation', () => {
            expect(helpers.getContextValue(RED, node, msg, 'user.name', 'msg')).toBe('John');
        });
        
        test('TC1.6: Returns undefined for non-existent msg path', () => {
            expect(helpers.getContextValue(RED, node, msg, 'nonexistent', 'msg')).toBeUndefined();
        });
        
        // Type: 'flow'
        test('TC1.7: Returns value from flow context', () => {
            mockContext.flow.set('testKey', 'testValue');
            expect(helpers.getContextValue(RED, node, msg, 'testKey', 'flow')).toBe('testValue');
        });
        
        test('TC1.8: Returns undefined when flow context key doesn\'t exist', () => {
            expect(helpers.getContextValue(RED, node, msg, 'nonexistent', 'flow')).toBeUndefined();
        });
        
        // Type: 'global'
        test('TC1.9: Returns value from global context', () => {
            mockContext.global.set('globalKey', 'globalValue');
            expect(helpers.getContextValue(RED, node, msg, 'globalKey', 'global')).toBe('globalValue');
        });
        
        test('TC1.10: Returns undefined when global context key doesn\'t exist', () => {
            expect(helpers.getContextValue(RED, node, msg, 'nonexistent', 'global')).toBeUndefined();
        });
        
        // Type: 'str' (default)
        test('TC1.11: Returns field as string when fieldType is undefined', () => {
            expect(helpers.getContextValue(RED, node, msg, 'hello', undefined)).toBe('hello');
        });
        
        test('TC1.12: Returns field as string when fieldType is \'str\'', () => {
            expect(helpers.getContextValue(RED, node, msg, 'hello', 'str')).toBe('hello');
        });
        
        // Type: 'num'
        test('TC1.13: Converts numeric string to number', () => {
            expect(helpers.getContextValue(RED, node, msg, '42', 'num')).toBe(42);
        });
        
        test('TC1.14: Converts integer to number', () => {
            expect(helpers.getContextValue(RED, node, msg, '123', 'num')).toBe(123);
        });
        
        test('TC1.15: Returns NaN for non-numeric string', () => {
            expect(helpers.getContextValue(RED, node, msg, 'abc', 'num')).toBeNaN();
        });
        
        // Type: 'bool'
        test('TC1.16: Returns true for string \'true\'', () => {
            expect(helpers.getContextValue(RED, node, msg, 'true', 'bool')).toBe(true);
        });
        
        test('TC1.17: Returns true for boolean true', () => {
            expect(helpers.getContextValue(RED, node, msg, true, 'bool')).toBe(true);
        });
        
        test('TC1.18: Returns false for string \'false\'', () => {
            expect(helpers.getContextValue(RED, node, msg, 'false', 'bool')).toBe(false);
        });
        
        test('TC1.19: Returns false for any other value', () => {
            expect(helpers.getContextValue(RED, node, msg, 'anything', 'bool')).toBe(false);
        });
        
        // Type: 'json'
        test('TC1.20: Parses valid JSON string to object', () => {
            const result = helpers.getContextValue(RED, node, msg, '{"name":"John"}', 'json');
            expect(result).toEqual({name: 'John'});
        });
        
        test('TC1.21: Parses valid JSON array', () => {
            const result = helpers.getContextValue(RED, node, msg, '[1,2,3]', 'json');
            expect(result).toEqual([1,2,3]);
        });
        
        test('TC1.22: Returns undefined and warns for invalid JSON', () => {
            const result = helpers.getContextValue(RED, node, msg, '{invalid}', 'json');
            expect(result).toBeUndefined();
            expect(node.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid JSON'));
        });
        
        test('TC1.23: Handles empty JSON object "{}"', () => {
            const result = helpers.getContextValue(RED, node, msg, '{}', 'json');
            expect(result).toEqual({});
        });
        
        // Type: default (unknown type)
        test('TC1.24: Returns field value for unknown fieldType', () => {
            expect(helpers.getContextValue(RED, node, msg, 'value', 'unknown')).toBe('value');
        });
    });
    
    // =================================================================
    // setContextValue Tests (12 cases)
    // =================================================================
    
    describe('setContextValue', () => {
        let RED, node, msg, mockContext;
        
        beforeEach(() => {
            mockContext = global.mockNodeContext();
            node = {
                ...global.mockNode(),
                context: jest.fn(() => mockContext)
            };
            RED = global.mockRED();
            msg = {};
        });
        
        // Edge Cases
        test('TC2.1: Returns early when field is null', () => {
            helpers.setContextValue(RED, node, msg, null, 'value', 'msg');
            expect(msg).toEqual({});
        });
        
        test('TC2.2: Returns early when field is undefined', () => {
            helpers.setContextValue(RED, node, msg, undefined, 'value', 'msg');
            expect(msg).toEqual({});
        });
        
        test('TC2.3: Returns early when field is empty string', () => {
            helpers.setContextValue(RED, node, msg, '', 'value', 'msg');
            expect(msg).toEqual({});
        });
        
        // Type: 'msg' (default)
        test('TC2.4: Sets value to msg property', () => {
            helpers.setContextValue(RED, node, msg, 'payload', 'testValue', 'msg');
            expect(msg.payload).toBe('testValue');
        });
        
        test('TC2.5: Sets nested value using dot notation', () => {
            helpers.setContextValue(RED, node, msg, 'user.name', 'John', 'msg');
            expect(msg.user.name).toBe('John');
        });
        
        test('TC2.6: Creates intermediate objects when path doesn\'t exist', () => {
            helpers.setContextValue(RED, node, msg, 'a.b.c', 'value', 'msg');
            expect(msg.a.b.c).toBe('value');
        });
        
        test('TC2.7: Deletes property when value is undefined', () => {
            msg.payload = 'test';
            helpers.setContextValue(RED, node, msg, 'payload', undefined, 'msg');
            expect(msg.payload).toBeUndefined();
        });
        
        // Type: 'flow'
        test('TC2.8: Sets value to flow context', () => {
            helpers.setContextValue(RED, node, msg, 'flowKey', 'flowValue', 'flow');
            expect(mockContext.flow.set).toHaveBeenCalledWith('flowKey', 'flowValue');
        });
        
        test('TC2.9: Overwrites existing flow context value', () => {
            mockContext.flow.set('key', 'oldValue');
            helpers.setContextValue(RED, node, msg, 'key', 'newValue', 'flow');
            expect(mockContext.flow.set).toHaveBeenCalledWith('key', 'newValue');
        });
        
        // Type: 'global'
        test('TC2.10: Sets value to global context', () => {
            helpers.setContextValue(RED, node, msg, 'globalKey', 'globalValue', 'global');
            expect(mockContext.global.set).toHaveBeenCalledWith('globalKey', 'globalValue');
        });
        
        test('TC2.11: Overwrites existing global context value', () => {
            mockContext.global.set('key', 'oldValue');
            helpers.setContextValue(RED, node, msg, 'key', 'newValue', 'global');
            expect(mockContext.global.set).toHaveBeenCalledWith('key', 'newValue');
        });
        
        // Type: undefined (defaults to 'msg')
        test('TC2.12: Uses \'msg\' type when fieldType is undefined', () => {
            helpers.setContextValue(RED, node, msg, 'payload', 'value', undefined);
            expect(msg.payload).toBe('value');
        });
    });
    
    // =================================================================
    // getByString Tests (12 cases)
    // =================================================================
    
    describe('getByString', () => {
        
        // Edge Cases
        test('TC3.1: Returns undefined when obj is null', () => {
            expect(helpers.getByString(null, 'path')).toBeUndefined();
        });
        
        test('TC3.2: Returns undefined when obj is undefined', () => {
            expect(helpers.getByString(undefined, 'path')).toBeUndefined();
        });
        
        test('TC3.3: Returns undefined when path is null', () => {
            expect(helpers.getByString({}, null)).toBeUndefined();
        });
        
        test('TC3.4: Returns undefined when path is empty string', () => {
            expect(helpers.getByString({}, '')).toBeUndefined();
        });
        
        // Simple Path
        test('TC3.5: Returns direct property value', () => {
            const obj = { name: 'John' };
            expect(helpers.getByString(obj, 'name')).toBe('John');
        });
        
        test('TC3.6: Returns undefined for non-existent property', () => {
            const obj = { name: 'John' };
            expect(helpers.getByString(obj, 'age')).toBeUndefined();
        });
        
        // Nested Path
        test('TC3.7: Returns nested property (2 levels)', () => {
            const obj = { user: { name: 'John' } };
            expect(helpers.getByString(obj, 'user.name')).toBe('John');
        });
        
        test('TC3.8: Returns deeply nested property (3+ levels)', () => {
            const obj = { user: { address: { city: 'NYC' } } };
            expect(helpers.getByString(obj, 'user.address.city')).toBe('NYC');
        });
        
        test('TC3.9: Returns undefined when intermediate path is null', () => {
            const obj = { user: null };
            expect(helpers.getByString(obj, 'user.name')).toBeUndefined();
        });
        
        test('TC3.10: Returns undefined when intermediate path is undefined', () => {
            const obj = { user: undefined };
            expect(helpers.getByString(obj, 'user.name')).toBeUndefined();
        });
        
        test('TC3.11: Returns undefined for non-existent nested path', () => {
            const obj = { user: {} };
            expect(helpers.getByString(obj, 'user.name.first')).toBeUndefined();
        });
        
        // Array Access
        test('TC3.12: Returns array element using numeric key', () => {
            const obj = { items: ['a', 'b', 'c'] };
            expect(helpers.getByString(obj, 'items.1')).toBe('b');
        });
    });
    
    // =================================================================
    // setByString Tests (12 cases)
    // =================================================================
    
    describe('setByString', () => {
        
        // Edge Cases
        test('TC4.1: Returns early when obj is null', () => {
            expect(() => helpers.setByString(null, 'path', 'value')).not.toThrow();
        });
        
        test('TC4.2: Returns early when obj is undefined', () => {
            expect(() => helpers.setByString(undefined, 'path', 'value')).not.toThrow();
        });
        
        test('TC4.3: Returns early when path is null', () => {
            const obj = {};
            helpers.setByString(obj, null, 'value');
            expect(obj).toEqual({});
        });
        
        test('TC4.4: Returns early when path is empty string', () => {
            const obj = {};
            helpers.setByString(obj, '', 'value');
            expect(obj).toEqual({});
        });
        
        // Simple Path
        test('TC4.5: Sets direct property value', () => {
            const obj = {};
            helpers.setByString(obj, 'name', 'John');
            expect(obj.name).toBe('John');
        });
        
        test('TC4.6: Overwrites existing property', () => {
            const obj = { name: 'Jane' };
            helpers.setByString(obj, 'name', 'John');
            expect(obj.name).toBe('John');
        });
        
        test('TC4.7: Deletes property when value is undefined', () => {
            const obj = { name: 'John' };
            helpers.setByString(obj, 'name', undefined);
            expect(obj.name).toBeUndefined();
            expect('name' in obj).toBe(false);
        });
        
        // Nested Path
        test('TC4.8: Creates intermediate objects for nested path', () => {
            const obj = {};
            helpers.setByString(obj, 'user.name', 'John');
            expect(obj.user.name).toBe('John');
        });
        
        test('TC4.9: Sets deeply nested property (3+ levels)', () => {
            const obj = {};
            helpers.setByString(obj, 'user.address.city', 'NYC');
            expect(obj.user.address.city).toBe('NYC');
        });
        
        test('TC4.10: Overwrites null intermediate value with object', () => {
            const obj = { user: null };
            helpers.setByString(obj, 'user.name', 'John');
            expect(obj.user.name).toBe('John');
        });
        
        test('TC4.11: Overwrites non-object intermediate value with object', () => {
            const obj = { user: 'string' };
            helpers.setByString(obj, 'user.name', 'John');
            expect(obj.user.name).toBe('John');
        });
        
        // Array Operations
        test('TC4.12: Sets array element using numeric key', () => {
            const obj = { items: ['a', 'b', 'c'] };
            helpers.setByString(obj, 'items.1', 'x');
            expect(obj.items[1]).toBe('x');
        });
    });
});
