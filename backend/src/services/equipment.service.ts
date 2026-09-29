import { IEquipmentService, IEquipmentRepository } from '../interfaces';
import { EquipmentRecord, CreateEquipmentDTO, UpdateEquipmentDTO } from '../models';
import { equipmentRepository } from '../repositories/equipment.repository';
import { PortSystem } from '../os/PortSystem';

export class EquipmentService implements IEquipmentService {
    private repo: IEquipmentRepository;
    private portSystem: PortSystem;

    constructor(
        repo: IEquipmentRepository = equipmentRepository,
        portSystem: PortSystem = PortSystem.getInstance()
    ) {
        this.repo = repo;
        this.portSystem = portSystem;
    }

    public async getEquipments(): Promise<EquipmentRecord[]> {
        return this.repo.findActive();
    }

    public async getEquipmentById(id: number): Promise<EquipmentRecord | null> {
        if (!id || id <= 0) {
            throw new Error('Invalid equipment ID provided.');
        }
        return this.repo.findById(id);
    }

    public async createEquipment(data: CreateEquipmentDTO): Promise<EquipmentRecord> {
        if (!data.name || !data.name.trim()) {
            throw new Error('Equipment name is required.');
        }
        if (!data.type) {
            throw new Error('Equipment type is required.');
        }

        const validTypes = ['Berth', 'Crane', 'Truck', 'Warehouse'];
        if (!validTypes.includes(data.type)) {
            throw new Error(`Invalid equipment type. Allowed types: ${validTypes.join(', ')}`);
        }

        const trimmedName = data.name.trim();
        const record = await this.repo.create({
            equipment_id: data.equipment_id || `EQ-${Date.now()}`,
            name: trimmedName,
            type: data.type,
            status: data.status || 'Available',
            created_by: data.created_by || 'system',
        });

        // OS Concurrency Engine Registration (SoC: Encapsulated in Service, not Controller)
        if (data.type === 'Crane') {
            this.portSystem.registerCrane(trimmedName);
        } else if (data.type === 'Berth') {
            this.portSystem.registerBerths(trimmedName, 1);
        }

        return record;
    }

    public async updateEquipment(id: number, data: UpdateEquipmentDTO): Promise<EquipmentRecord | null> {
        const existing = await this.repo.findById(id);
        if (!existing) {
            return null;
        }

        return this.repo.update(id, data);
    }

    public async deleteEquipment(id: number, deletedBy: string): Promise<EquipmentRecord | null> {
        const existing = await this.repo.findById(id);
        if (!existing) {
            return null;
        }

        return this.repo.softDelete(id, deletedBy || 'system');
    }
}

export const equipmentService = new EquipmentService();
