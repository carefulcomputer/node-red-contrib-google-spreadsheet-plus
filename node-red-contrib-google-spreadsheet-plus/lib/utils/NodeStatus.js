/**
 * Utility class for managing Node-RED node status
 * Centralizes status management with predefined states
 */
class NodeStatus {
    // Predefined status configurations
    static STATES = {
        MISSING_CREDENTIAL: { fill: "red", shape: "ring", text: "Missing credential" },
        VALIDATING: { fill: "blue", shape: "dot", text: "Validating..." },
        INVALID_ID: { fill: "red", shape: "ring", text: "Invalid ID" },
        INVALID_RANGE: { fill: "red", shape: "ring", text: "Invalid range" },
        VALIDATION_ERROR: { fill: "red", shape: "ring", text: "Validation error" },
        AUTH_ERROR: { fill: "red", shape: "ring", text: "Auth error" },
        PROCESSING: { fill: "blue", shape: "dot", text: "Processing..." },
        SUCCESS: { fill: "green", shape: "dot", text: "Success" },
        ERROR: { fill: "red", shape: "dot", text: "Error" },
        CLEAR: {}
    };
    
    /**
     * Create a NodeStatus manager for a specific node
     * @param {Object} node - Node-RED node instance
     */
    constructor(node) {
        this.node = node;
    }
    
    /**
     * Set status to a predefined state
     * @param {string} stateName - Name of the state from STATES
     */
    set(stateName) {
        const state = NodeStatus.STATES[stateName];
        if (state) {
            this.node.status(state);
        }
    }
    
    /**
     * Set custom status
     * @param {Object} status - Status configuration {fill, shape, text}
     */
    setCustom(status) {
        this.node.status(status);
    }
    
    /**
     * Set error status with custom message
     * @param {string} message - Error message to display
     */
    setError(message) {
        this.node.status({ fill: "red", shape: "dot", text: message });
    }
    
    /**
     * Clear status
     */
    clear() {
        this.node.status({});
    }
}

module.exports = NodeStatus;
