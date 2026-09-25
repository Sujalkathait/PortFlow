import { PortSystem } from '../os/PortSystem';
import { Process } from '../os/Process';

export interface OperationRecord {
    id: number;
    processId: string;
    operation_type: string;
    ship_id: string;
    ship_name: string;
    crane_id: string;
    berth_id: string;
    priority: number;
    status: 'Queued' | 'Running' | 'Completed' | 'Cancelled';
    start_time: string | null;
    end_time: string | null;
    waiting_time_ms?: number;
    turnaround_time_ms?: number;
    created_at: string;
}

export class OperationsService {
    private portSystem: PortSystem;
    private operations: OperationRecord[] = [];
    private idCounter = 101;

    constructor() {
        this.portSystem = PortSystem.getInstance();
        this.portSystem.registerCrane('Crane A');
        this.portSystem.registerCrane('Crane B');
        this.portSystem.registerBerths('Berth 1', 1);
        this.portSystem.registerBerths('Berth 2', 1);
    }

    public getOperations(): OperationRecord[] {
        return [...this.operations].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    public getOperationById(id: number): OperationRecord | undefined {
        return this.operations.find(op => op.id === id);
    }

    public async submitOperation(data: {
        operationType: string;
        shipId?: string;
        shipName?: string;
        craneId?: string;
        berthId?: string;
        priority?: number;
        burstDuration?: number;
    }): Promise<OperationRecord> {
        const id = this.idCounter++;
        const processId = `op-${id}`;
        const burstTime = Number(data.burstDuration) || 4000;
        const requiredResources: string[] = [];

        if (data.craneId && data.craneId !== 'None') {
            requiredResources.push(data.craneId);
        }

        const operation: OperationRecord = {
            id,
            processId,
            operation_type: data.operationType || 'Container Discharge',
            ship_id: data.shipId || `SHIP-${id}`,
            ship_name: data.shipName || 'MV Ocean Carrier',
            crane_id: data.craneId || 'None',
            berth_id: data.berthId || 'Berth 1',
            priority: Number(data.priority) || 1,
            status: 'Queued',
            start_time: null,
            end_time: null,
            created_at: new Date().toISOString()
        };

        this.operations.push(operation);

        // OS Concept: Create Process & Add to FCFS Scheduler Ready Queue
        const process = new Process(
            processId,
            burstTime,
            requiredResources,
            operation.priority
        );

        this.portSystem.addProcess(process);

        // Execute via OS Scheduler with Mutex Lock acquisition
        setTimeout(() => {
            void this.executeOperationProcess(operation, process);
        }, 300);

        return operation;
    }

    private async executeOperationProcess(operation: OperationRecord, _process: Process) {
        operation.status = 'Running';
        operation.start_time = new Date().toISOString();

        // OS Concept: CPU Scheduling, Mutex lock on Crane, and Burst Time Execution
        const finishedProcess = await this.portSystem.executeNextProcess();
        if (finishedProcess) {
            operation.status = 'Completed';
            operation.end_time = new Date().toISOString();
            operation.waiting_time_ms = finishedProcess.waitingTime;
            operation.turnaround_time_ms = finishedProcess.turnaroundTime;
        }
    }

    public async dispatchNext(): Promise<Process | null> {
        return this.portSystem.executeNextProcess();
    }

    public updateOperation(id: number, updates: Partial<OperationRecord>): OperationRecord | null {
        const op = this.operations.find(o => o.id === id);
        if (!op) return null;

        Object.assign(op, updates);
        return op;
    }

    public deleteOperation(id: number): boolean {
        const index = this.operations.findIndex(o => o.id === id);
        if (index === -1) return false;

        const [removed] = this.operations.splice(index, 1);
        this.portSystem.removeProcess(removed.processId);
        return true;
    }

    public getMetrics() {
        const uniqueShips = new Set(this.operations.map(o => o.ship_name)).size;
        const activeOps = this.operations.filter(o => o.status === 'Queued' || o.status === 'Running').length;
        const totalContainers = this.operations.length * 140;
        const activeBerths = new Set(
            this.operations.filter(o => o.status === 'Running').map(o => o.berth_id)
        ).size;

        return {
            ships: uniqueShips,
            operations: activeOps,
            containers: totalContainers,
            resources: activeBerths
        };
    }
}
