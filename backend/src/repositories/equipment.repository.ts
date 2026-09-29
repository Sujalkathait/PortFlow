import { prisma } from '../config/prisma';
import { IEquipmentRepository } from '../interfaces/repositories.interface';
import { EquipmentRecord, CreateEquipmentDTO, UpdateEquipmentDTO } from '../models/equipment.model';

function normalize(row: any): EquipmentRecord {
    if (!row) return row;
    return {
        ...row,
        created_at: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
        deleted_at: row.deleted_at ? row.deleted_at.toISOString() : null,
    };
}

export class EquipmentRepository implements IEquipmentRepository {
    async findActive(): Promise<EquipmentRecord[]> {
        const rows = await prisma.equipment.findMany({
            where: { deleted_at: null },
            orderBy: { created_at: 'desc' }
        });
        return rows.map(normalize);
    }

    async findById(id: number): Promise<EquipmentRecord | null> {
        const row = await prisma.equipment.findFirst({
            where: { id, deleted_at: null }
        });
        return row ? normalize(row) : null;
    }

    async findByEquipmentId(equipmentId: string): Promise<EquipmentRecord | null> {
        const row = await prisma.equipment.findFirst({
            where: { equipment_id: equipmentId, deleted_at: null }
        });
        return row ? normalize(row) : null;
    }

    async create(data: CreateEquipmentDTO): Promise<EquipmentRecord> {
        const created = await prisma.equipment.create({
            data: {
                equipment_id: data.equipment_id || `EQ-${Date.now()}`,
                name: data.name,
                type: data.type || 'Berth',
                status: data.status || 'Available',
                created_by: data.created_by,
            }
        });
        return normalize(created);
    }

    async update(id: number, data: UpdateEquipmentDTO): Promise<EquipmentRecord | null> {
        const updated = await prisma.equipment.update({
            where: { id },
            data
        });
        return normalize(updated);
    }

    async softDelete(id: number, by: string): Promise<EquipmentRecord | null> {
        const deleted = await prisma.equipment.update({
            where: { id },
            data: { deleted_at: new Date(), deleted_by: by }
        });
        return normalize(deleted);
    }

    async restore(id: number): Promise<EquipmentRecord | null> {
        const restored = await prisma.equipment.update({
            where: { id },
            data: { deleted_at: null, deleted_by: null }
        });
        return normalize(restored);
    }

    async permanentDelete(id: number): Promise<boolean> {
        await prisma.equipment.delete({ where: { id } });
        return true;
    }
}

export const equipmentRepository = new EquipmentRepository();
