import { IOperationsService, IOperationsRepository } from '../interfaces';
import {
    OperationRecord,
    CreateOperationDTO,
    UpdateOperationDTO,
    OperationMetricsDTO
} from '../models';
import { operationsRepository } from '../repositories/operations.repository';
import { PortSystem } from '../os/PortSystem';
import { Process } from '../os/Process';

export class OperationsService implements IOperationsService {
    private repo: IOperationsRepository;
    private portSystem: PortSystem;

    constructor(
        repo: IOperationsRepository = operationsRepository,
        portSystem: PortSystem = PortSystem.getInstance()
    ) {
        this.repo = repo;
        this.portSystem = portSystem;

        // Register default port infrastructure in OS engine
        this.portSystem.registerCrane('Crane A');
        this.portSystem.registerCrane('Crane B');
        this.portSystem.registerBerths('Berth 1', 1);
        this.portSystem.registerBerths('Berth 2', 1);
    }

    /** READ — all active operations with optional user filtering */
    public async getOperations(userFilter?: { role?: string; email?: string }): Promise<OperationRecord[]> {
        let ops = await this.repo.findActive();
        if (userFilter?.role === 'Operator' && userFilter?.email) {
            ops = ops.filter(op => op.created_by === userFilter.email);
        }
        return ops;
    }

    /** READ — single active operation by ID */
    public async getOperationById(id: number): Promise<OperationRecord | null> {
        if (!id || id <= 0) {
            throw new Error('Invalid operation ID provided.');
        }
        return this.repo.findById(id);
    }

    /** CREATE — submit a new operation to scheduler & database */
    public async submitOperation(data: CreateOperationDTO): Promise<OperationRecord> {
        if (!data.operationType || !data.shipName) {
            throw new Error('Operation type and ship name are required.');
        }

        const burstTime = Number(data.burstDuration) || 4000;
        const requiredEquipments: string[] = [];

        if (data.craneId && data.craneId !== 'None') {
            requiredEquipments.push(data.craneId);
        }

        const operation = await this.repo.create({
            operationType: data.operationType,
            shipName: data.shipName,
            craneId: data.craneId,
            berthId: data.berthId,
            priority: data.priority,
            created_by: data.created_by,
        });

        // OS Concept: Create a Process and add to FCFS/SJF/Priority Ready Queue
        const process = new Process(operation.processId, burstTime, requiredEquipments, operation.priority);
        this.portSystem.addProcess(process);

        return operation;
    }

    /** Run the next process from the queue through the OS scheduler */
    public async dispatchNext(): Promise<{ operationId: number; process: Process } | null> {
        const result = await this.portSystem.executeNextProcess();
        if (!result) return null;

        // Find matching operation by process id or numerical id
        const opId = Number(result.id.replace('op-', ''));
        const op = await this.repo.findById(opId);
        if (op) {
            await this.repo.update(opId, {
                status: 'Completed',
                start_time: result.startTime ? new Date(result.startTime).toISOString() : new Date().toISOString(),
                end_time: new Date().toISOString(),
                waiting_time_ms: result.waitingTime,
                turnaround_time_ms: result.turnaroundTime,
            });
        }

        return { operationId: opId, process: result };
    }

    /** UPDATE — change operation fields and calculate metrics */
    public async updateOperation(id: number, updates: UpdateOperationDTO): Promise<OperationRecord | null> {
        if (!id || id <= 0) {
            throw new Error('Invalid operation ID provided.');
        }

        if (updates.status === 'Running') {
            updates.start_time = updates.start_time || new Date().toISOString();
        }
        if (updates.status === 'Completed' || updates.status === 'Cancelled') {
            updates.end_time = updates.end_time || new Date().toISOString();
            const op = await this.repo.findById(id);
            if (op) {
                updates.turnaround_time_ms = Date.now() - new Date(op.created_at).getTime();
                if (op.start_time) {
                    updates.waiting_time_ms = new Date(op.start_time).getTime() - new Date(op.created_at).getTime();
                }
            }
        }
        return this.repo.update(id, updates);
    }

    /** SOFT DELETE — move to trash & remove from OS queue */
    public async deleteOperation(id: number, deletedBy: string): Promise<OperationRecord | null> {
        if (!id || id <= 0) {
            throw new Error('Invalid operation ID provided.');
        }

        const op = await this.repo.findById(id);
        if (op) {
            this.portSystem.removeProcess(op.processId);
        }
        return this.repo.softDelete(id, deletedBy);
    }

    /** Get real analytics from actual database records */
    public async getMetrics(): Promise<OperationMetricsDTO> {
        const ops = await this.repo.findActive();
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

export const operationsService = new OperationsService();
