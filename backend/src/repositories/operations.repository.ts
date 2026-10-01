import { prisma } from '../config/prisma';
import { IOperationsRepository } from '../interfaces/repositories.interface';
import {
    OperationRecord,
    CreateOperationDTO,
    UpdateOperationDTO
} from '../models/operation.model';

export { OperationRecord };

function normalize(row: any): OperationRecord {
    if (!row) return row;
    return {
        ...row,
        processId: row.process_id || `op-${row.id}`,
        process_id: row.process_id || `op-${row.id}`,
        start_time: row.start_time ? row.start_time.toISOString() : null,
        end_time: row.end_time ? row.end_time.toISOString() : null,
        created_at: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
        deleted_at: row.deleted_at ? row.deleted_at.toISOString() : null,
    };
}

export class OperationsRepository implements IOperationsRepository {
    async findActive(): Promise<OperationRecord[]> {
        const res = await prisma.operation.findMany({
            where: { deleted_at: null },
            orderBy: { created_at: 'desc' }
        });
        return res.map(normalize);
    }

    async findById(id: number): Promise<OperationRecord | null> {
        const res = await prisma.operation.findFirst({
            where: { id, deleted_at: null }
        });
        return res ? normalize(res) : null;
    }

    async findByProcessId(processId: string): Promise<OperationRecord | null> {
        const res = await prisma.operation.findFirst({
            where: { process_id: processId, deleted_at: null }
        });
        return res ? normalize(res) : null;
    }

    async create(data: CreateOperationDTO): Promise<OperationRecord> {
        try {
            const updated = await prisma.$transaction(async (tx) => {
                const res = await tx.operation.create({
                    data: {
                        operation_type: data.operationType,
                        ship_name: data.shipName,
                        crane_id: data.craneId || 'None',
                        berth_id: data.berthId || 'Berth 1',
                        priority: data.priority || 1,
                        status: 'Queued',
                        created_by: data.created_by
                    }
                });
                const processId = `op-${res.id}`;
                return await tx.operation.update({
                    where: { id: res.id },
                    data: { process_id: processId }
                });
            });
            return normalize(updated);
        } catch (err: any) {
            console.error('[OperationsRepository] DB create error:', err.message);
            throw err;
        }
    }

    async update(id: number, updates: UpdateOperationDTO): Promise<OperationRecord | null> {
        try {
            const data: any = {};
            if (updates.status !== undefined) data.status = updates.status;
            if (updates.start_time !== undefined) data.start_time = updates.start_time ? new Date(updates.start_time) : null;
            if (updates.end_time !== undefined) data.end_time = updates.end_time ? new Date(updates.end_time) : null;
            if (updates.waiting_time_ms !== undefined) data.waiting_time_ms = updates.waiting_time_ms;
            if (updates.turnaround_time_ms !== undefined) data.turnaround_time_ms = updates.turnaround_time_ms;
            if (updates.crane_id !== undefined) data.crane_id = updates.crane_id;
            if (updates.berth_id !== undefined) data.berth_id = updates.berth_id;
            if (updates.priority !== undefined) data.priority = updates.priority;

            if (Object.keys(data).length === 0) return this.findById(id);

            const res = await prisma.operation.update({
                where: { id },
                data
            });
            return normalize(res);
        } catch (err: any) {
            console.error('[OperationsRepository] DB update error:', err.message);
            throw err;
        }
    }

    async softDelete(id: number, deletedBy: string): Promise<OperationRecord | null> {
        try {
            const res = await prisma.operation.update({
                where: { id },
                data: { deleted_at: new Date(), deleted_by: deletedBy }
            });
            return normalize(res);
        } catch (err: any) {
            console.error('[OperationsRepository] DB softDelete error:', err.message);
            throw err;
        }
    }

    async restore(id: number): Promise<OperationRecord | null> {
        try {
            const res = await prisma.operation.update({
                where: { id },
                data: { deleted_at: null, deleted_by: null }
            });
            return normalize(res);
        } catch (err: any) {
            console.error('[OperationsRepository] DB restore error:', err.message);
            throw err;
        }
    }

    async permanentDelete(id: number): Promise<boolean> {
        try {
            await prisma.operation.delete({
                where: { id }
            });
            return true;
        } catch (err: any) {
            console.error('[OperationsRepository] DB permanentDelete error:', err.message);
            throw err;
        }
    }
}

export const operationsRepository = new OperationsRepository();
