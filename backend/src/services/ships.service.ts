import { IShipsService, IShipsRepository } from '../interfaces';
import { ShipRecord, CreateShipDTO, UpdateShipDTO } from '../models';
import { shipsRepository } from '../repositories/ships.repository';

export class ShipsService implements IShipsService {
    private repo: IShipsRepository;

    constructor(repo: IShipsRepository = shipsRepository) {
        this.repo = repo;
    }

    public async getShips(): Promise<ShipRecord[]> {
        return this.repo.findActive();
    }

    public async getShipById(id: number): Promise<ShipRecord | null> {
        if (!id || id <= 0) {
            throw new Error('Invalid ship ID provided.');
        }
        return this.repo.findById(id);
    }

    public async createShip(data: CreateShipDTO): Promise<ShipRecord> {
        if (!data.name || !data.name.trim()) {
            throw new Error('Ship name is required.');
        }

        // Validate IMO uniqueness if provided
        if (data.imo_number && data.imo_number.trim()) {
            const existing = await this.repo.findByImo(data.imo_number.trim());
            if (existing) {
                throw new Error(`Ship with IMO number ${data.imo_number} already exists.`);
            }
        }

        return this.repo.create({
            name: data.name.trim(),
            imo_number: data.imo_number?.trim(),
            vessel_type: data.vessel_type || 'Container',
            capacity_teu: Math.max(0, Number(data.capacity_teu) || 0),
            berth_id: data.berth_id || null,
            created_by: data.created_by || 'system',
        });
    }

    public async updateShip(id: number, data: UpdateShipDTO): Promise<ShipRecord | null> {
        const existing = await this.repo.findById(id);
        if (!existing) {
            return null;
        }

        return this.repo.update(id, {
            ...data,
            name: data.name ? data.name.trim() : undefined,
            imo_number: data.imo_number ? data.imo_number.trim() : undefined,
            capacity_teu: data.capacity_teu !== undefined ? Math.max(0, Number(data.capacity_teu)) : undefined,
        });
    }

    public async deleteShip(id: number, deletedBy: string): Promise<ShipRecord | null> {
        const existing = await this.repo.findById(id);
        if (!existing) {
            return null;
        }
        return this.repo.softDelete(id, deletedBy || 'system');
    }
}

export const shipsService = new ShipsService();
