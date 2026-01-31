/**
 * Unit tests for nodes/google-service-account.js
 * Simplified tests focusing on module structure rather than async internals
 */

describe('nodes/google-service-account.js', () => {
    
    let mockRED;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        mockRED = {
            nodes: {
                createNode: jest.fn(),
                registerType: jest.fn()
            }
        };
    });
    
    describe('Module structure', () => {
        
        test('TC9.1: Module exports a function', () => {
            // Mock googleapis to avoid import errors
            jest.mock('googleapis', () => ({
                google: {
                    auth: {
                        JWT: jest.fn()
                    }
                }
            }), { virtual: true });
            
            const serviceAccountModule = require('../../nodes/google-service-account.js');
            expect(typeof serviceAccountModule).toBe('function');
        });
        
        test('TC9.2: Module registers google-service-account type', () => {
            jest.mock('googleapis', () => ({
                google: {
                    auth: {
                        JWT: jest.fn()
                    }
                }
            }), { virtual: true });
            
            const serviceAccountModule = require('../../nodes/google-service-account.js');
            serviceAccountModule(mockRED);
            
            expect(mockRED.nodes.registerType).toHaveBeenCalledWith(
                'google-service-account',
                expect.any(Function),
                expect.objectContaining({
                    credentials: expect.any(Object)
                })
            );
        });
        
        test('TC9.3: Credentials schema includes required fields', () => {
            jest.mock('googleapis', () => ({
                google: {
                    auth: {
                        JWT: jest.fn()
                    }
                }
            }), { virtual: true });
            
            const serviceAccountModule = require('../../nodes/google-service-account.js');
            serviceAccountModule(mockRED);
            
            const credentialsSchema = mockRED.nodes.registerType.mock.calls[0][2].credentials;
            
            expect(credentialsSchema).toHaveProperty('projectId');
            expect(credentialsSchema).toHaveProperty('client_email');
            expect(credentialsSchema).toHaveProperty('private_key');
            expect(credentialsSchema).toHaveProperty('json');
        });
        
        test('TC9.4: Module can be required without errors', () => {
            expect(() => {
                jest.mock('googleapis', () => ({
                    google: {
                        auth: {
                            JWT: jest.fn()
                        }
                    }
                }), { virtual: true });
                
                require('../../nodes/google-service-account.js');
            }).not.toThrow();
        });
    });
});
