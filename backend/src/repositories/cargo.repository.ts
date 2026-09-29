import { prisma } from '../config/prisma';
import { ICargoRepository } from '../interfaces/repositories.interface';
import { CargoRecord, CreateCargoDTO, UpdateCargoDTO } from '../models/cargo.model';

function normalize(row: any): CargoRecord {
    if (!row) return row;
    return {
        ...row,
        created_at: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
        deleted_at: row.deleted_at ? row.deleted_at.toISOString() : null,
    };
}

export class CargoRepository implements ICargoRepository {
    async findActive(): Promise<CargoRecord[]> {
        const rows = await prisma.cargo.findMany({
            where: { deleted_at: null },
            orderBy: { created_at: 'desc' }
        });
        return rows.map(normalize);
    }

    async findById(id: number): Promise<CargoRecord | null> {
        const row = await prisma.cargo.findFirst({
            where: { id, deleted_at: null }
        });
        return row ? normalize(row) : null;
    }

    async findByCargoNumber(cargoNumber: string): Promise<CargoRecord | null> {
        const row = await prisma.cargo.findFirst({
            where: { cargo_number: cargoNumber, deleted_at: null }
        });
        return row ? normalize(row) : null;
    }

    async create(data: CreateCargoDTO): Promise<CargoRecord> {
        const created = await prisma.cargo.create({
            data: {
                cargo_number: data.cargo_number,
                size_type: data.size_type || '20ft',
                weight_tons: data.weight_tons ?? 0,
                cargo_type: data.cargo_type || 'General',
                current_location: data.current_location || 'Yard',
                ship_name: data.ship_name || '',
                created_by: data.created_by,
            }
        });
        return normalize(created);
    }

    async update(id: number, data: UpdateCargoDTO): Promise<CargoRecord | null> {
        const updated = await prisma.cargo.update({
            where: { id },
            data
        });
        return normalize(updated);
    }

    async softDelete(id: number, by: string): Promise<CargoRecord | null> {
        const deleted = await prisma.cargo.update({
            where: { id },
            data: { deleted_at: new Date(), deleted_by: by }
        });
        return normalize(deleted);
    }

    async restore(id: number): Promise<CargoRecord | null> {
        const restored = await prisma.cargo.update({
            where: { id },
            data: { deleted_at: null, deleted_by: null }
        });
        return normalize(restored);
    }

    async permanentDelete(id: number): Promise<boolean> {
        await prisma.cargo.delete({ where: { id } });
        return true;
    }
}

export const cargoRepository = new CargoRepository();
