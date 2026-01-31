/**
 * Jest setup file for mocking Node-RED and external dependencies
 */

// Mock Node-RED context methods
global.mockNodeContext = () => {
    const flowContext = new Map();
    const globalContext = new Map();
    
    return {
        flow: {
            get: jest.fn((key) => flowContext.get(key)),
            set: jest.fn((key, value) => flowContext.set(key, value))
        },
        global: {
            get: jest.fn((key) => globalContext.get(key)),
            set: jest.fn((key, value) => globalContext.set(key, value))
        }
    };
};

// Mock Node-RED node instance
global.mockNode = () => ({
    warn: jest.fn(),
    error: jest.fn(),
    send: jest.fn(),
    status: jest.fn(),
    context: jest.fn(() => global.mockNodeContext())
});

// Mock RED API
global.mockRED = () => ({
    nodes: {
        createNode: jest.fn(),
        registerType: jest.fn(),
        getNode: jest.fn()
    }
});
