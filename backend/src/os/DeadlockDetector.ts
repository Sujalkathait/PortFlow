import { Process } from './Process';

// Simple deadlock detection using Equipment allocation graph concepts
export class DeadlockDetector {
    // Check for circular wait among processes
    static detectDeadlock(processes: Process[], EquipmentLocks: Record<string, string>): boolean {
        // Build wait-for graph: A -> B means A is waiting for a Equipment held by B
        const waitForGraph = new Map<string, string>();
        
        for (const p of processes) {
            if (p.status === 'WAITING' && p.requiredEquipments.length > 0) {
                // Find what Equipment it's waiting for that is currently locked
                for (const res of p.requiredEquipments) {
                    if (EquipmentLocks[res] && EquipmentLocks[res] !== p.id) {
                        waitForGraph.set(p.id, EquipmentLocks[res]);
                        break;
                    }
                }
            }
        }

        // Detect cycle in wait-for graph
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        for (const node of waitForGraph.keys()) {
            if (this.isCyclic(node, waitForGraph, visited, recursionStack)) {
                return true;
            }
        }
        return false;
    }

    private static isCyclic(
        node: string, 
        graph: Map<string, string>, 
        visited: Set<string>, 
        recStack: Set<string>
    ): boolean {
        if (!visited.has(node)) {
            visited.add(node);
            recStack.add(node);

            const nextNode = graph.get(node);
            if (nextNode) {
                if (!visited.has(nextNode) && this.isCyclic(nextNode, graph, visited, recStack)) {
                    return true;
                } else if (recStack.has(nextNode)) {
                    return true;
                }
            }
        }
        recStack.delete(node);
        return false;
    }
}

