import { PortSystem } from '../PortSystem';
import { Process } from '../Process';

describe('PortSystem OS Module', () => {
    let portSystem: PortSystem;

    beforeEach(() => {
        // Reset singleton for testing if necessary, or just use it
        portSystem = (PortSystem as any).instance = new (PortSystem as any)();
    });

    test('should add process to ready queue', () => {
        const process = new Process('op-1', 1000, ['Crane A']);
        portSystem.addProcess(process);
        const state = portSystem.getSystemState();
        expect(state.readyQueue.length).toBe(1);
        expect(state.readyQueue[0].id).toBe('op-1');
    });

    test('should detect deadlock', () => {
        // Mock a deadlock scenario
        const p1 = new Process('p1', 1000, ['ResB']);
        const p2 = new Process('p2', 1000, ['ResA']);
        portSystem.addProcess(p1);
        portSystem.addProcess(p2);
        
        p1.status = 'WAITING';
        p2.status = 'WAITING';
        
        portSystem.registerCrane('ResA');
        portSystem.registerCrane('ResB');
        
        // Force locks
        const mutexA = (portSystem as any).mutexes.get('ResA');
        const mutexB = (portSystem as any).mutexes.get('ResB');
        
        mutexA.isLocked = true;
        mutexA.owner = p1; // p1 holds ResA
        
        mutexB.isLocked = true;
        mutexB.owner = p2; // p2 holds ResB

        // P1 wants ResB, P2 wants ResA -> Cycle
        expect(portSystem.checkDeadlock()).toBe(true);
    });
});
