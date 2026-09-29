import { prisma } from '../config/prisma';
import { IShipsRepository } from '../interfaces/repositories.interface';
import { ShipRecord, CreateShipDTO, UpdateShipDTO } from '../models/ship.model';

export { ShipRecord };

function normalize(row: any): ShipRecord {
    if (!row) return row;
    return {
        ...row,
        created_at: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
        deleted_at: row.deleted_at ? row.deleted_at.toISOString() : null,
    };
}

export class ShipsRepository implements IShipsRepository {
    async findActive(): Promise<ShipRecord[]> {
        try {
            const res = await prisma.ship.findMany({
                where: { deleted_at: null },
                orderBy: { created_at: 'desc' }
            });
            return res.map(normalize);
        } catch (err: any) {
            console.error('[ShipsRepository] DB findActive error:', err.message);
            return [];
        }
    }

    async findById(id: number): Promise<ShipRecord | null> {
        try {
            const res = await prisma.ship.findFirst({
                where: { id, deleted_at: null }
            });
            return res ? normalize(res) : null;
        } catch (err: any) {
            console.error('[ShipsRepository] DB findById error:', err.message);
            return null;
        }
    }

    async findByImo(imo: string): Promise<ShipRecord | null> {
        try {
            const res = await prisma.ship.findFirst({
                where: { imo_number: imo, deleted_at: null }
            });
            return res ? normalize(res) : null;
        } catch (err: any) {
            console.error('[ShipsRepository] DB findByImo error:', err.message);
            return null;
        }
    }

    async create(data: CreateShipDTO): Promise<ShipRecord> {
        try {
            const res = await prisma.ship.create({
                data: {
                    imo_number: data.imo_number || `IMO-${Date.now()}`,
                    name: data.name,
                    vessel_type: data.vessel_type || 'General Cargo',
                    capacity_teu: Number(data.capacity_teu) || 0,
                    status: 'Arriving',
                    berth_id: data.berth_id || null,
                    created_by: data.created_by
                }
            });
            return normalize(res);
        } catch (err: any) {
            console.error('[ShipsRepository] DB create error:', err.message);
            throw err;
        }
    }

    async update(id: number, updates: UpdateShipDTO): Promise<ShipRecord | null> {
        try {
            const data: any = {};
            if (updates.name !== undefined) data.name = updates.name;
            if (updates.status !== undefined) data.status = updates.status;
            if (updates.vessel_type !== undefined) data.vessel_type = updates.vessel_type;
            if (updates.capacity_teu !== undefined) data.capacity_teu = updates.capacity_teu;
            if (updates.berth_id !== undefined) data.berth_id = updates.berth_id;

            if (Object.keys(data).length === 0) return this.findById(id);

            const res = await prisma.ship.update({
                where: { id },
                data
            });
            return normalize(res);
        } catch (err: any) {
            console.error('[ShipsRepository] DB update error:', err.message);
            throw err;
        }
    }

    async softDelete(id: number, deletedBy: string): Promise<ShipRecord | null> {
        try {
            const res = await prisma.ship.update({
                where: { id },
                data: { deleted_at: new Date(), deleted_by: deletedBy }
            });
            return normalize(res);
        } catch (err: any) {
            console.error('[ShipsRepository] DB softDelete error:', err.message);
            throw err;
        }
    }

    async restore(id: number): Promise<ShipRecord | null> {
        try {
            const res = await prisma.ship.update({
                where: { id },
                data: { deleted_at: null, deleted_by: null }
            });
            return normalize(res);
        } catch (err: any) {
            console.error('[ShipsRepository] DB restore error:', err.message);
            throw err;
        }
    }

    async permanentDelete(id: number): Promise<boolean> {
        try {
            await prisma.ship.delete({
                where: { id }
            });
            return true;
        } catch (err: any) {
            console.error('[ShipsRepository] DB permanentDelete error:', err.message);
            throw err;
        }
    }
}

export const shipsRepository = new ShipsRepository();
