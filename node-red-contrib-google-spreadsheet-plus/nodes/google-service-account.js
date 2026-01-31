const { google } = require("googleapis");

/**
 * Node-RED module for Google Service Account authentication
 * Provides JWT-based authentication for Google APIs
 */
module.exports = function(RED) {
    const register = function (config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.name = config.name;
        node.scope = config.scope;
        
        // Parse credentials from JSON or individual fields
        node.cred = {};
        
        if (config.way === "json" && node.credentials && node.credentials.json) {
            try {
                // typedInput with type 'json' might store as string or object
                const jsonCred = node.credentials.json;
                node.cred = typeof jsonCred === 'string' 
                    ? JSON.parse(jsonCred)
                    : jsonCred;
                
                // Fix escaped newlines in private_key from JSON
                if (node.cred.private_key && typeof node.cred.private_key === 'string') {
                    node.cred.private_key = node.cred.private_key.replace(/\\n/g, '\n');
                }
            } catch (err) {
                node.error('Failed to parse JSON credentials: ' + err.message);
            }
        } else if (config.way === "fields" || !config.way) {
            // Use individual fields
            if (node.credentials) {
                if (node.credentials.projectId) {
                    node.cred.project_id = node.credentials.projectId;
                }
                if (node.credentials.client_email) {
                    node.cred.client_email = node.credentials.client_email;
                }
                if (node.credentials.private_key) {
                    node.cred.private_key = node.credentials.private_key.replace(/\\n/g, '\n');
                }
            }
        }
        
        // Validate required credentials
        if (!node.cred.client_email) {
            node.error('Missing client_email in service account credentials');
        }
        if (!node.cred.private_key) {
            node.error('Missing private_key in service account credentials');
        }
        
        // Remove credentials from memory after parsing (only if we have what we need)
        if (node.credentials) {
            delete node.credentials;
        }

        // Initialize JWT client
        try {
            if (!node.cred.client_email || !node.cred.private_key) {
                throw new Error('Missing required credentials (client_email and private_key)');
            }
            
            // Google Auth library expects the full credential object, not individual parameters
            node.jwtClient = new google.auth.JWT({
                email: node.cred.client_email,
                key: node.cred.private_key,
                scopes: node.scope
            });
            
            // Modern async/await authentication method with token caching
            node.authenticate = async (callback) => {
                try {
                    // Check if we have a valid cached token (with 5 minute buffer before expiry)
                    const now = Date.now();
                    const bufferMs = 5 * 60 * 1000; // 5 minutes
                    
                    if (node.client && node.token && node.token.expires && (node.token.expires - bufferMs) > now) {
                        // Token is still valid, return cached client
                        if (callback) {
                            callback(node.client, node.token);
                        }
                        return node.client;
                    }
                    
                    // Token expired or doesn't exist, authenticate
                    const auth = await authenticateAsync(node);
                    
                    // Support legacy callback pattern for backward compatibility
                    if (callback) {
                        callback(auth.client, auth.token);
                    }
                    
                    return auth.client;
                } catch (err) {
                    node.error('Authentication failed: ' + err.message);
                    if (callback) {
                        // Legacy callback error pattern
                        node.warn(err);
                    }
                    throw err;
                }
            };
        } catch (err) {
            node.error('Failed to initialize JWT client: ' + err.message);
        }
    };

    RED.nodes.registerType("google-service-account", register, {
        credentials: {    
            projectId:    { type: "text" },
            client_email: { type: "text" },
            private_key:  { type: "text" },
            json:         { type: "text" }
        }
    });
};

/**
 * Authenticate using JWT and return client with automatic token refresh
 * @param {Object} node - Node-RED node instance
 * @returns {Promise<{client: JWT, token: Object}>} Authenticated client and token info
 */
async function authenticateAsync(node) {
    try {
        // Set up automatic token refresh listener (only once)
        if (!node._tokenListenerSetup) {
            node.jwtClient.on('tokens', (tokens) => {
                if (tokens.access_token) {
                    node.token = {
                        type: tokens.token_type || 'Bearer',
                        value: tokens.access_token,
                        expires: tokens.expiry_date
                    };
                }
            });
            node._tokenListenerSetup = true;
        }
        
        // Authorize and get tokens
        const tokens = await node.jwtClient.authorize();
        
        // Cache client and token info
        node.client = node.jwtClient;
        node.token = {
            type: tokens.token_type,
            value: tokens.access_token,
            expires: tokens.expiry_date
        };
        
        return {
            client: node.jwtClient,
            token: node.token
        };
    } catch (err) {
        throw new Error(`JWT authorization failed: ${err.message}`);
    }
}