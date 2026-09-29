import { ICargoService, ICargoRepository } from '../interfaces';
import { CargoRecord, CreateCargoDTO, UpdateCargoDTO } from '../models';
import { cargoRepository } from '../repositories/cargo.repository';

export class CargoService implements ICargoService {
    private repo: ICargoRepository;

    constructor(repo: ICargoRepository = cargoRepository) {
        this.repo = repo;
    }

    public async getCargos(): Promise<CargoRecord[]> {
        return this.repo.findActive();
    }

    public async getCargoById(id: number): Promise<CargoRecord | null> {
        if (!id || id <= 0) {
            throw new Error('Invalid cargo ID provided.');
        }
        return this.repo.findById(id);
    }

    public async createCargo(data: CreateCargoDTO): Promise<CargoRecord> {
        if (!data.cargo_number || !data.cargo_number.trim()) {
            throw new Error('Cargo container number is required.');
        }

        const existing = await this.repo.findByCargoNumber(data.cargo_number.trim());
        if (existing) {
            throw new Error(`Cargo with number ${data.cargo_number} already exists.`);
        }

        return this.repo.create({
            cargo_number: data.cargo_number.trim(),
            size_type: data.size_type || '20ft',
            weight_tons: Math.max(0, Number(data.weight_tons) || 0),
            cargo_type: data.cargo_type || 'General',
            current_location: data.current_location || 'Yard',
            ship_name: data.ship_name?.trim() || '',
            created_by: data.created_by || 'system',
        });
    }

    public async updateCargo(id: number, data: UpdateCargoDTO): Promise<CargoRecord | null> {
        const existing = await this.repo.findById(id);
        if (!existing) {
            return null;
        }

        return this.repo.update(id, {
            ...data,
            cargo_number: data.cargo_number ? data.cargo_number.trim() : undefined,
            weight_tons: data.weight_tons !== undefined ? Math.max(0, Number(data.weight_tons)) : undefined,
        });
    }

    public async deleteCargo(id: number, deletedBy: string): Promise<CargoRecord | null> {
        const existing = await this.repo.findById(id);
        if (!existing) {
            return null;
        }
        return this.repo.softDelete(id, deletedBy || 'system');
    }
}

export const cargoService = new CargoService();
