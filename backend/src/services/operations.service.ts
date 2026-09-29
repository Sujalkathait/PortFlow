import { operationsRepository, type OperationRecord } from '../repositories/operations.repository';
import { PortSystem } from '../os/PortSystem';
import { Process } from '../os/Process';

export class OperationsService {
    private portSystem: PortSystem;

    constructor() {
        this.portSystem = PortSystem.getInstance();
        // Register default port infrastructure in OS engine
        this.portSystem.registerCrane('Crane A');
        this.portSystem.registerCrane('Crane B');
        this.portSystem.registerBerths('Berth 1', 1);
        this.portSystem.registerBerths('Berth 2', 1);
    }

    /** READ — all active operations (excludes soft-deleted) */
    public async getOperations(): Promise<OperationRecord[]> {
        return operationsRepository.findActive();
    }

    /** READ — single active operation by ID */
    public async getOperationById(id: number): Promise<OperationRecord | null> {
        return operationsRepository.findById(id);
    }

    /** CREATE — submit a new operation to scheduler & database */
    public async submitOperation(data: {
        operationType: string;
        shipName: string;
        craneId?: string;
        berthId?: string;
        priority?: number;
        burstDuration?: number;
        created_by: string;
    }): Promise<OperationRecord> {
        const burstTime = Number(data.burstDuration) || 4000;
        const requiredEquipments: string[] = [];

        if (data.craneId && data.craneId !== 'None') {
            requiredEquipments.push(data.craneId);
        }

        const operation = await operationsRepository.create({
            operationType: data.operationType,
            shipName: data.shipName,
            craneId: data.craneId,
            berthId: data.berthId,
            priority: data.priority,
            created_by: data.created_by,
        });

        // OS Concept: Create a Process and add to FCFS Ready Queue
        const process = new Process(operation.processId, burstTime, requiredEquipments, operation.priority);
        this.portSystem.addProcess(process);

        return operation;
    }

    /** Run the next process from the FCFS queue through the OS scheduler */
    public async dispatchNext(): Promise<{ operationId: number; process: Process } | null> {
        const result = await this.portSystem.executeNextProcess();
        if (!result) return null;

        // Find the matching operation by process id or numerical id
        const opId = Number(result.id.replace('op-', ''));
        const op = await operationsRepository.findById(opId);
        if (op) {
            await operationsRepository.update(opId, {
                status: 'Completed',
                start_time: result.startTime ? new Date(result.startTime).toISOString() : new Date().toISOString(),
                end_time: new Date().toISOString(),
                waiting_time_ms: result.waitingTime,
                turnaround_time_ms: result.turnaroundTime,
            });
        }

        return { operationId: opId, process: result };
    }

    /** UPDATE — change operation fields */
    public async updateOperation(id: number, updates: Partial<OperationRecord>): Promise<OperationRecord | null> {
        if (updates.status === 'Running') {
            updates.start_time = updates.start_time || new Date().toISOString();
        }
        if (updates.status === 'Completed' || updates.status === 'Cancelled') {
            updates.end_time = updates.end_time || new Date().toISOString();
            const op = await operationsRepository.findById(id);
            if (op) {
                updates.turnaround_time_ms = Date.now() - new Date(op.created_at).getTime();
                if (op.start_time) {
                    updates.waiting_time_ms = new Date(op.start_time).getTime() - new Date(op.created_at).getTime();
                }
            }
        }
        return operationsRepository.update(id, updates);
    }

    /** SOFT DELETE — move to trash */
    public async deleteOperation(id: number, deletedBy: string): Promise<OperationRecord | null> {
        const op = await operationsRepository.findById(id);
        if (op) {
            this.portSystem.removeProcess(op.processId);
        }
        return operationsRepository.softDelete(id, deletedBy);
    }

    /** Get real analytics from actual database records */
    public async getMetrics() {
        const ops = await operationsRepository.findActive();
        const queued = ops.filter(o => o.status === 'Queued').length;
        const running = ops.filter(o => o.status === 'Running').length;
        const completed = ops.filter(o => o.status === 'Completed').length;
        const cancelled = ops.filter(o => o.status === 'Cancelled').length;
        const total = ops.length;

        const completedOps = ops.filter(o => o.turnaround_time_ms !== null);
        const avgTurnaround = completedOps.length > 0
            ? Math.round(completedOps.reduce((sum, o) => sum + (o.turnaround_time_ms || 0), 0) / completedOps.length)
            : 0;
        const avgWaiting = completedOps.length > 0
            ? Math.round(completedOps.reduce((sum, o) => sum + (o.waiting_time_ms || 0), 0) / completedOps.length)
            : 0;

        const uniqueShips = new Set(ops.map(o => o.ship_name)).size;

        return {
            total,
            queued,
            running,
            completed,
            cancelled,
            uniqueShips,
            avgTurnaroundMs: avgTurnaround,
            avgWaitingMs: avgWaiting,
        };
    }
}


