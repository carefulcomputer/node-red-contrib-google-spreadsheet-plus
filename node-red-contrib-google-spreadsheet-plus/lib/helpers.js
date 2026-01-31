/**
 * Utility functions for Node-RED context and property manipulation
 * Replaces external helper dependency with inline implementations
 */

/**
 * Get a value from msg, flow, or global context based on type
 * @param {Object} RED - Node-RED API object
 * @param {Object} node - Node instance
 * @param {Object} msg - Message object
 * @param {string} field - Field name/path
 * @param {string} fieldType - Type: 'msg', 'flow', 'global', 'str', 'num', 'bool', 'json'
 * @returns {*} Retrieved value
 */
function getContextValue(RED, node, msg, field, fieldType) {
    if (!field) return undefined;
    
    fieldType = fieldType || 'str';
    
    switch (fieldType) {
        case 'msg':
            return getByString(msg, field);
        case 'flow':
            return node.context().flow.get(field);
        case 'global':
            return node.context().global.get(field);
        case 'str':
            return field;
        case 'num':
            return Number(field);
        case 'bool':
            return field === 'true' || field === true;
        case 'json':
            try {
                return JSON.parse(field);
            } catch (e) {
                node.warn('Invalid JSON: ' + field);
                return undefined;
            }
        default:
            return field;
    }
}

/**
 * Set a value to msg, flow, or global context based on type
 * @param {Object} RED - Node-RED API object
 * @param {Object} node - Node instance
 * @param {Object} msg - Message object
 * @param {string} field - Field name/path
 * @param {*} value - Value to set
 * @param {string} fieldType - Type: 'msg', 'flow', 'global'
 */
function setContextValue(RED, node, msg, field, value, fieldType) {
    if (!field) return;
    
    fieldType = fieldType || 'msg';
    
    switch (fieldType) {
        case 'msg':
            setByString(msg, field, value);
            break;
        case 'flow':
            node.context().flow.set(field, value);
            break;
        case 'global':
            node.context().global.set(field, value);
            break;
    }
}

/**
 * Get a nested property from an object using dot notation
 * @param {Object} obj - Source object
 * @param {string} path - Dot-notated path (e.g., 'user.address.city')
 * @returns {*} Value at path or undefined
 */
function getByString(obj, path) {
    if (!obj || !path) return undefined;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
        if (current === null || current === undefined) {
            return undefined;
        }
        current = current[key];
    }
    
    return current;
}

/**
 * Set a nested property in an object using dot notation
 * Creates intermediate objects as needed
 * @param {Object} obj - Target object
 * @param {string} path - Dot-notated path (e.g., 'user.address.city')
 * @param {*} value - Value to set
 */
function setByString(obj, path, value) {
    if (!obj || !path) return;
    
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    
    // Create intermediate objects
    for (const key of keys) {
        if (current[key] === null || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    
    // Set the final value
    if (value === undefined) {
        delete current[lastKey];
    } else {
        current[lastKey] = value;
    }
}

module.exports = {
    getContextValue,
    setContextValue,
    getByString,
    setByString
};
