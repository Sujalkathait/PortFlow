import { prisma } from '../config/prisma';
import { operationsRepository } from './operations.repository';
import { shipsRepository } from './ships.repository';
import { cargoRepository } from './cargo.repository';
import { equipmentRepository } from './equipment.repository';

export interface TrashedRecord {
    id: number;
    _collection: 'operations' | 'ships' | 'Cargos' | 'Equipments';
    label?: string;
    name?: string;
    operation_type?: string;
    cargo_number?: string;
    ship_name?: string;
    status?: string;
    created_by?: string;
    created_at: string;
    deleted_at: string;
    deleted_by?: string;
}

export class TrashRepository {
    async getTrash(): Promise<TrashedRecord[]> {
        try {
            const [ops, ships, Cargos, Equipments] = await Promise.all([
                prisma.operation.findMany({ where: { deleted_at: { not: null } } }),
                prisma.ship.findMany({ where: { deleted_at: { not: null } } }),
                prisma.cargo.findMany({ where: { deleted_at: { not: null } } }),
                prisma.equipment.findMany({ where: { deleted_at: { not: null } } }),
            ]);

            const all: TrashedRecord[] = [
                ...ops.map(o => ({
                    id: o.id,
                    _collection: 'operations' as const,
                    label: o.operation_type,
                    ship_name: o.ship_name,
                    status: o.status,
                    created_by: o.created_by,
                    created_at: o.created_at.toISOString(),
                    deleted_at: o.deleted_at!.toISOString(),
                    deleted_by: o.deleted_by || undefined
                })),
                ...ships.map(s => ({
                    id: s.id,
                    _collection: 'ships' as const,
                    label: s.name,
                    ship_name: s.imo_number,
                    status: s.status,
                    created_by: s.created_by,
                    created_at: s.created_at.toISOString(),
                    deleted_at: s.deleted_at!.toISOString(),
                    deleted_by: s.deleted_by || undefined
                })),
                ...Cargos.map(c => ({
                    id: c.id,
                    _collection: 'Cargos' as const,
                    label: c.cargo_number,
                    ship_name: c.ship_name,
                    status: c.status,
                    created_by: c.created_by,
                    created_at: c.created_at.toISOString(),
                    deleted_at: c.deleted_at!.toISOString(),
                    deleted_by: c.deleted_by || undefined
                })),
                ...Equipments.map(r => ({
                    id: r.id,
                    _collection: 'Equipments' as const,
                    label: r.name,
                    ship_name: r.type,
                    status: r.status,
                    created_by: r.created_by,
                    created_at: r.created_at.toISOString(),
                    deleted_at: r.deleted_at!.toISOString(),
                    deleted_by: r.deleted_by || undefined
                }))
            ];

            return all.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
        } catch (err: any) {
            console.error('[TrashRepository] DB getTrash error:', err.message);
            return [];
        }
    }

    async restore(collection: string, id: number): Promise<any | null> {
        switch (collection) {
            case 'operations': return !!(await operationsRepository.restore(id));
            case 'ships': return !!(await shipsRepository.restore(id));
            case 'Cargos': return !!(await cargoRepository.restore(id));
            case 'Equipments': return !!(await equipmentRepository.restore(id));
            default: return null;
        }
    }

    async permanentDelete(collection: string, id: number): Promise<boolean> {
        switch (collection) {
            case 'operations': return !!(await operationsRepository.permanentDelete(id));
            case 'ships': return !!(await shipsRepository.permanentDelete(id));
            case 'Cargos': return !!(await cargoRepository.permanentDelete(id));
            case 'Equipments': return !!(await equipmentRepository.permanentDelete(id));
            default: return false;
        }
    }

    async emptyTrash(): Promise<{ total: number; details: Record<string, number> }> {
        try {
            const [ops, ships, Cargos, Equipments] = await Promise.all([
                prisma.operation.deleteMany({ where: { deleted_at: { not: null } } }),
                prisma.ship.deleteMany({ where: { deleted_at: { not: null } } }),
                prisma.cargo.deleteMany({ where: { deleted_at: { not: null } } }),
                prisma.equipment.deleteMany({ where: { deleted_at: { not: null } } }),
            ]);

            const total = ops.count + ships.count + Cargos.count + Equipments.count;
            return {
                total,
                details: {
                    operations: ops.count,
                    ships: ships.count,
                    Cargos: Cargos.count,
                    Equipments: Equipments.count,
                }
            };
        } catch (err: any) {
            console.error('[TrashRepository] DB emptyTrash error:', err.message);
            return { total: 0, details: { operations: 0, ships: 0, Cargos: 0, Equipments: 0 } };
        }
    }
}

export const trashRepository = new TrashRepository();


