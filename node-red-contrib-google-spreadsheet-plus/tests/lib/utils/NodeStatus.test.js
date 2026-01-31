/**
 * Unit tests for NodeStatus utility
 */

const NodeStatus = require('../../../lib/utils/NodeStatus');

describe('NodeStatus', () => {
    let mockNode;
    let nodeStatus;
    
    beforeEach(() => {
        mockNode = {
            status: jest.fn()
        };
        nodeStatus = new NodeStatus(mockNode);
    });
    
    describe('Predefined states', () => {
        test('Sets MISSING_CREDENTIAL status', () => {
            nodeStatus.set('MISSING_CREDENTIAL');
            expect(mockNode.status).toHaveBeenCalledWith({
                fill: "red",
                shape: "ring",
                text: "Missing credential"
            });
        });
        
        test('Sets VALIDATING status', () => {
            nodeStatus.set('VALIDATING');
            expect(mockNode.status).toHaveBeenCalledWith({
                fill: "blue",
                shape: "dot",
                text: "Validating..."
            });
        });
        
        test('Sets PROCESSING status', () => {
            nodeStatus.set('PROCESSING');
            expect(mockNode.status).toHaveBeenCalledWith({
                fill: "blue",
                shape: "dot",
                text: "Processing..."
            });
        });
        
        test('Sets SUCCESS status', () => {
            nodeStatus.set('SUCCESS');
            expect(mockNode.status).toHaveBeenCalledWith({
                fill: "green",
                shape: "dot",
                text: "Success"
            });
        });
        
        test('Sets ERROR status', () => {
            nodeStatus.set('ERROR');
            expect(mockNode.status).toHaveBeenCalledWith({
                fill: "red",
                shape: "dot",
                text: "Error"
            });
        });
        
        test('Clears status with CLEAR', () => {
            nodeStatus.set('CLEAR');
            expect(mockNode.status).toHaveBeenCalledWith({});
        });
    });
    
    describe('Custom methods', () => {
        test('setCustom sets custom status', () => {
            const customStatus = { fill: "yellow", shape: "ring", text: "Custom" };
            nodeStatus.setCustom(customStatus);
            expect(mockNode.status).toHaveBeenCalledWith(customStatus);
        });
        
        test('setError sets error with custom message', () => {
            nodeStatus.setError('Connection failed');
            expect(mockNode.status).toHaveBeenCalledWith({
                fill: "red",
                shape: "dot",
                text: "Connection failed"
            });
        });
        
        test('clear clears status', () => {
            nodeStatus.clear();
            expect(mockNode.status).toHaveBeenCalledWith({});
        });
    });
    
    describe('Invalid state', () => {
        test('Does nothing for invalid state name', () => {
            nodeStatus.set('INVALID_STATE_NAME');
            expect(mockNode.status).not.toHaveBeenCalled();
        });
    });
});
