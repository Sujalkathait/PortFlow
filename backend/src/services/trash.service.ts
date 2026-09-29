import { ITrashService, ITrashRepository } from '../interfaces';
import { TrashedRecord, TrashCollection } from '../models';
import { trashRepository } from '../repositories/trash.repository';

const VALID_COLLECTIONS: TrashCollection[] = ['operations', 'ships', 'Cargos', 'Equipments'];

export class TrashService implements ITrashService {
    private repo: ITrashRepository;

    constructor(repo: ITrashRepository = trashRepository) {
        this.repo = repo;
    }

    public async getTrash(): Promise<TrashedRecord[]> {
        return this.repo.getTrash();
    }

    public async restoreItem(collection: string, id: number): Promise<any> {
        if (!VALID_COLLECTIONS.includes(collection as TrashCollection)) {
            throw new Error(`Invalid trash collection: ${collection}. Allowed: ${VALID_COLLECTIONS.join(', ')}`);
        }
        if (!id || id <= 0) {
            throw new Error('Invalid record ID provided.');
        }

        const restored = await this.repo.restore(collection, id);
        if (!restored) {
            throw new Error(`Record ${id} not found in collection ${collection}`);
        }
        return restored;
    }

    public async permanentlyDeleteItem(collection: string, id: number): Promise<boolean> {
        if (!VALID_COLLECTIONS.includes(collection as TrashCollection)) {
            throw new Error(`Invalid trash collection: ${collection}. Allowed: ${VALID_COLLECTIONS.join(', ')}`);
        }
        if (!id || id <= 0) {
            throw new Error('Invalid record ID provided.');
        }

        return this.repo.permanentDelete(collection, id);
    }

    public async emptyAllTrash(): Promise<{ count: number }> {
        return this.repo.emptyTrash();
    }
}

export const trashService = new TrashService();
