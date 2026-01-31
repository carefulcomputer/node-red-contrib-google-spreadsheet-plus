/**
 * Service class for caching spreadsheet data
 * Manages cache storage and retrieval using context objects
 */
class CacheService {
    /**
     * Get cached data from storage
     * @param {Object} storage - Cache storage object (saveLoc)
     * @param {string} key - Cache key (saveField)
     * @returns {*} Cached data or undefined if not found
     */
    get(storage, key) {
        if (!storage) throw new Error('Storage is required');
        if (!key) throw new Error('Key is required');
        
        const keys = key.split('.');
        let current = storage;
        
        for (const k of keys) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[k];
        }
        
        return current;
    }
    
    /**
     * Set data in cache storage
     * @param {Object} storage - Cache storage object (saveLoc)
     * @param {string} key - Cache key (saveField)
     * @param {*} value - Value to cache
     */
    set(storage, key, value) {
        if (!storage) throw new Error('Storage is required');
        if (!key) throw new Error('Key is required');
        
        const keys = key.split('.');
        const lastKey = keys.pop();
        let current = storage;
        
        // Create intermediate objects
        for (const k of keys) {
            if (current[k] === null || typeof current[k] !== 'object') {
                current[k] = {};
            }
            current = current[k];
        }
        
        // Set or delete the value
        if (value === undefined) {
            delete current[lastKey];
        } else {
            current[lastKey] = value;
        }
    }
    
    /**
     * Invalidate (delete) cached data
     * @param {Object} storage - Cache storage object (saveLoc)
     * @param {string} key - Cache key (saveField)
     */
    invalidate(storage, key) {
        this.set(storage, key, undefined);
    }
    
    /**
     * Check if data is cached
     * @param {Object} storage - Cache storage object (saveLoc)
     * @param {string} key - Cache key (saveField)
     * @returns {boolean} True if cached data exists
     */
    has(storage, key) {
        const value = this.get(storage, key);
        return value !== undefined && (Array.isArray(value) ? value.length > 0 : true);
    }
}

module.exports = CacheService;
