/**
 * Unit tests for CacheService
 * Tests caching operations: get, set, invalidate, has
 */

const CacheService = require('../../../lib/services/CacheService');

describe('CacheService', () => {
    let cacheService;
    let storage;
    
    beforeEach(() => {
        cacheService = new CacheService();
        storage = {};
    });
    
    describe('get', () => {
        test('Throws error when storage is null', () => {
            expect(() => cacheService.get(null, 'key')).toThrow('Storage is required');
        });
        
        test('Throws error when key is null', () => {
            expect(() => cacheService.get(storage, null)).toThrow('Key is required');
        });
        
        test('Returns simple value', () => {
            storage.key = 'value';
            expect(cacheService.get(storage, 'key')).toBe('value');
        });
        
        test('Returns nested value', () => {
            storage.user = { name: 'John' };
            expect(cacheService.get(storage, 'user.name')).toBe('John');
        });
        
        test('Returns undefined for non-existent key', () => {
            expect(cacheService.get(storage, 'nonexistent')).toBeUndefined();
        });
        
        test('Returns undefined when intermediate path is null', () => {
            storage.user = null;
            expect(cacheService.get(storage, 'user.name')).toBeUndefined();
        });
    });
    
    describe('set', () => {
        test('Throws error when storage is null', () => {
            expect(() => cacheService.set(null, 'key', 'value')).toThrow('Storage is required');
        });
        
        test('Throws error when key is null', () => {
            expect(() => cacheService.set(storage, null, 'value')).toThrow('Key is required');
        });
        
        test('Sets simple value', () => {
            cacheService.set(storage, 'key', 'value');
            expect(storage.key).toBe('value');
        });
        
        test('Sets nested value', () => {
            cacheService.set(storage, 'user.name', 'John');
            expect(storage.user.name).toBe('John');
        });
        
        test('Creates intermediate objects', () => {
            cacheService.set(storage, 'a.b.c', 'value');
            expect(storage.a.b.c).toBe('value');
        });
        
        test('Deletes value when set to undefined', () => {
            storage.key = 'value';
            cacheService.set(storage, 'key', undefined);
            expect('key' in storage).toBe(false);
        });
        
        test('Overwrites existing value', () => {
            storage.key = 'old';
            cacheService.set(storage, 'key', 'new');
            expect(storage.key).toBe('new');
        });
    });
    
    describe('invalidate', () => {
        test('Removes cached value', () => {
            storage.key = 'value';
            cacheService.invalidate(storage, 'key');
            expect('key' in storage).toBe(false);
        });
        
        test('Handles non-existent key', () => {
            expect(() => cacheService.invalidate(storage, 'nonexistent')).not.toThrow();
        });
    });
    
    describe('has', () => {
        test('Returns false when storage is empty', () => {
            expect(cacheService.has(storage, 'key')).toBe(false);
        });
        
        test('Returns true when value exists', () => {
            storage.key = 'value';
            expect(cacheService.has(storage, 'key')).toBe(true);
        });
        
        test('Returns false when value is undefined', () => {
            storage.key = undefined;
            expect(cacheService.has(storage, 'key')).toBe(false);
        });
        
        test('Returns false when array is empty', () => {
            storage.key = [];
            expect(cacheService.has(storage, 'key')).toBe(false);
        });
        
        test('Returns true when array has elements', () => {
            storage.key = [1, 2, 3];
            expect(cacheService.has(storage, 'key')).toBe(true);
        });
        
        test('Returns true for non-array non-empty values', () => {
            storage.key = 0;
            expect(cacheService.has(storage, 'key')).toBe(true);
        });
    });
});
