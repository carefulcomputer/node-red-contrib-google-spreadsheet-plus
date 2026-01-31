/**
 * Data transformation utilities for Google Sheets operations
 * Handles conversion between different data formats and spreadsheet values
 */
class DataTransformer {
    /**
     * Transform input data to spreadsheet format
     * @param {*} data - Input data (array or object)
     * @param {Object} config - Configuration options
     * @returns {Array<Array>} 2D array of values for spreadsheet
     */
    transform(data, config) {
        const fields = (config.selfields && config.selfields[0]) ? Array.from(config.selfields) : undefined;
        
        // Handle primitive values (string, number, boolean) - wrap in 2D array
        if (data !== null && data !== undefined && typeof data !== 'object') {
            return [[data]];
        }
        
        // Handle array of arrays (pass through)
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
            return data;
        }
        
        // Handle single-value array - wrap in 2D array
        if (Array.isArray(data) && data.length === 1 && typeof data[0] !== 'object') {
            return [[data[0]]];
        }
        
        // Handle array of objects
        if (Array.isArray(data) && data.length > 0) {
            return this.transformArrayOfObjects(data, config, fields);
        }
        
        // Handle object of objects
        if (typeof data === 'object' && data.length === undefined) {
            return this.transformObjectOfObjects(data, config, fields);
        }
        
        throw new Error('Unsupported data format');
    }
    
    /**
     * Transform array of objects to 2D array
     * @param {Array<Object>} rows - Array of objects
     * @param {Object} config - Configuration options
     * @param {Array<string>} fields - Field names to extract
     * @returns {Array<Array>} 2D array of values
     */
    transformArrayOfObjects(rows, config, fields) {
        const values = [];
        
        if (config.fields === 'all') {
            // Extract all fields from objects
            for (const obj of rows) {
                const extracted = this.extractObjectValues(obj);
                values.push(extracted.values);
            }
            
            // Add headers if requested
            if (config.method === 'new' && config.line) {
                const firstObj = this.extractObjectValues(rows[0]);
                values.unshift(firstObj.keys);
            }
        } else if (fields) {
            // Extract only selected fields
            for (const obj of rows) {
                const extracted = this.extractObjectValues(obj);
                const row = [];
                for (const field of fields) {
                    const i = extracted.keys.indexOf(field);
                    if (i > -1) row.push(extracted.values[i]);
                }
                values.push(row);
            }
            
            // Add headers if requested
            if (config.method === 'new' && config.line) {
                values.unshift(fields);
            }
        }
        
        return values;
    }
    
    /**
     * Transform object of objects to 2D array
     * @param {Object} data - Object where values are objects
     * @param {Object} config - Configuration options
     * @param {Array<string>} fields - Field names to extract
     * @returns {Array<Array>} 2D array of values
     */
    transformObjectOfObjects(data, config, fields) {
        const values = [];
        const labels = [];
        
        if (config.fields === 'all') {
            // Extract all fields from nested objects
            for (const key in data) {
                const extracted = this.extractObjectValues(data[key]);
                values.push(extracted.values);
                labels.push(key);
            }
            
            // Add headers if requested
            if (config.method === 'new') {
                if (config.line) {
                    const firstExtracted = this.extractObjectValues(data[labels[0]]);
                    values.unshift(firstExtracted.keys);
                }
                if (config.column) {
                    this.addColumnLabels(values, labels, config.line);
                }
            }
        } else if (fields) {
            // Extract only selected fields
            for (const key in data) {
                const extracted = this.extractObjectValues(data[key]);
                const row = [];
                for (const field of fields) {
                    const i = extracted.keys.indexOf(field);
                    if (i > -1) row.push(extracted.values[i]);
                }
                values.push(row);
                labels.push(key);
            }
            
            // Add headers if requested
            if (config.method === 'new') {
                if (config.line) {
                    values.unshift(fields);
                }
                if (config.column) {
                    this.addColumnLabels(values, labels, config.line);
                }
            }
        }
        
        return values;
    }
    
    /**
     * Add column labels to the first column
     * @param {Array<Array>} values - 2D array to modify
     * @param {Array<string>} labels - Column labels
     * @param {boolean} hasLineHeaders - Whether line headers are present
     */
    addColumnLabels(values, labels, hasLineHeaders) {
        if (hasLineHeaders) {
            values[0].unshift('Elements');
            for (let i = 0; i < labels.length; i++) {
                values[i + 1].unshift(labels[i]);
            }
        } else {
            for (let i = 0; i < labels.length; i++) {
                values[i].unshift(labels[i]);
            }
        }
    }
    
    /**
     * Extract keys and values from a nested object
     * @param {Object} obj - Object to extract from
     * @returns {{keys: Array<string>, values: Array}} Extracted keys and values
     */
    extractObjectValues(obj) {
        const keys = [];
        const values = [];
        
        const extract = (current, prefix = '') => {
            for (const key in current) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                
                if (typeof current[key] === 'object' && current[key] && current[key].length === undefined) {
                    // Recursively extract nested objects
                    extract(current[key], fullKey);
                } else {
                    // Store leaf values
                    keys.push(fullKey);
                    values.push(current[key]);
                }
            }
        };
        
        extract(obj);
        return { keys, values };
    }
    
    /**
     * Transform spreadsheet response to objects using headers
     * @param {Array<Array>} values - 2D array from spreadsheet
     * @param {Array<string>} fields - Field names to map to
     * @returns {Array<Object>} Array of objects
     */
    transformToObjects(values, fields) {
        if (!values || values.length === 0) return [];
        if (!fields || fields.length === 0) return values;
        
        const result = [];
        for (const row of values) {
            const obj = {};
            for (let i = 0; i < row.length; i++) {
                this.setNestedProperty(obj, fields[i], row[i]);
            }
            result.push(obj);
        }
        return result;
    }
    
    /**
     * Set nested property using dot notation
     * @param {Object} obj - Target object
     * @param {string} path - Dot-notated path
     * @param {*} value - Value to set
     */
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = obj;
        
        for (const key of keys) {
            if (current[key] === null || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
    }
    
    /**
     * Deep copy array of arrays
     * @param {Array<Array>} values - Array to copy
     * @returns {Array<Array>} Deep copied array
     */
    copyValuesArray(values) {
        const result = [];
        for (const row of values) {
            result.push(Array.isArray(row) ? Array.from(row) : row);
        }
        return result;
    }
    
    /**
     * Transform spreadsheet get response based on configuration
     * @param {Array<Array>} values - Response values from API
     * @param {Object} config - Configuration with line/column options
     * @param {string} majorDimension - ROWS or COLUMNS
     * @returns {*} Transformed data (array or object)
     */
    transformGetResponse(values, config, majorDimension) {
        const response = this.copyValuesArray(values);
        
        // No transformation needed
        if (!config.line && !config.column) {
            // Unwrap single cell reads: [[value]] -> value
            if (response.length === 1 && response[0].length === 1) {
                return response[0][0];
            }
            return response;
        }
        
        // Both line and column headers
        if (config.line && config.column) {
            return this._transformWithBothHeaders(response);
        }
        
        // Single header dimension
        if ((config.column && (majorDimension === "COLUMNS" || config.direction === "column")) || 
            (config.line && (majorDimension === "ROWS" || config.direction === "line"))) {
            return this._transformWithSingleHeader(response);
        } else {
            return this._transformToObjectArray(response);
        }
    }
    
    /**
     * Transform with both line and column headers
     * @param {Array<Array>} response - Response data
     * @returns {Object} Object of objects
     * @private
     */
    _transformWithBothHeaders(response) {
        const objet = {};
        const line_labels = response.shift();
        line_labels.shift();
        
        for (const obj of response) {
            const newl = {};
            const item = obj.shift();
            for (let i = 0; i < obj.length; i++) {
                newl[line_labels[i]] = obj[i];
            }
            objet[item] = newl;
        }
        return objet;
    }
    
    /**
     * Transform with single header (first row/column as keys)
     * @param {Array<Array>} response - Response data
     * @returns {Object} Object with keys from first element
     * @private
     */
    _transformWithSingleHeader(response) {
        const objet = {};
        for (const obj of response) {
            objet[obj.shift()] = obj;
        }
        return objet;
    }
    
    /**
     * Transform to array of objects using first row as headers
     * @param {Array<Array>} response - Response data
     * @returns {Array<Object>} Array of objects
     * @private
     */
    _transformToObjectArray(response) {
        const array = [];
        const line_labels = response.shift();

        for (const obj of response) {
            const newl = {};
            for (let i = 0; i < obj.length; i++) {
                newl[line_labels[i]] = obj[i];
            }
            array.push(newl);
        }
        return array;
    }
    
    /**
     * Transform cell response to get a specific cell value by row and column labels
     * @param {Array<Array>} values - 2D array with headers
     * @param {string} cell_l - Row label (line)
     * @param {string} cell_c - Column label
     * @returns {string|number} Cell value or "Not found"
     */
    transformCellResponse(values, cell_l, cell_c) {
        if (!values || values.length === 0) return 'Not found';
        
        // First row contains column headers
        const headerRow = values[0];
        const colIndex = headerRow.indexOf(cell_c);
        
        if (colIndex === -1) return 'Not found';
        
        // Find the row with matching row label (first column)
        for (let i = 1; i < values.length; i++) {
            if (values[i][0] === cell_l) {
                const cellValue = values[i][colIndex];
                return cellValue !== undefined && cellValue !== '' ? cellValue : 'Not found';
            }
        }
        
        return 'Not found';
    }
}

module.exports = DataTransformer;
