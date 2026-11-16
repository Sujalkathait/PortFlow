import { ITrashService, ITrashRepository } from '../interfaces';
import { TrashedRecord, TrashCollection } from '../models';
import { trashRepository } from '../repositories/trash.repository';

const VALID_COLLECTIONS: TrashCollection[] = [
    'operations',
    'ships',
    'Cargos',
    'Equipments',
    'warehouses',
    'trucks',
    'gate_passes',
    'customs_inspections',
    'bills',
    'issues'
];

function normalizeCollection(collection: string): TrashCollection {
    const lower = (collection || '').toLowerCase().trim();
    if (lower === 'cargos' || lower === 'cargo') return 'Cargos';
    if (lower === 'equipments' || lower === 'equipment') return 'Equipments';
    if (lower === 'ships' || lower === 'ship') return 'ships';
    if (lower === 'operations' || lower === 'operation') return 'operations';
    if (lower === 'warehouses' || lower === 'warehouse') return 'warehouses';
    if (lower === 'trucks' || lower === 'truck') return 'trucks';
    if (lower === 'gate_passes' || lower === 'gate_pass' || lower === 'gatepasses' || lower === 'gatepass') return 'gate_passes';
    if (lower === 'customs_inspections' || lower === 'customs_inspection' || lower === 'customs') return 'customs_inspections';
    if (lower === 'bills' || lower === 'bill' || lower === 'invoices' || lower === 'invoice') return 'bills';
    if (lower === 'issues' || lower === 'issue' || lower === 'incidents' || lower === 'incident') return 'issues';
    return collection as TrashCollection;
}

export class TrashService implements ITrashService {
    private repo: ITrashRepository;

    constructor(repo: ITrashRepository = trashRepository) {
        this.repo = repo;
    }

    public async getTrash(): Promise<TrashedRecord[]> {
        try {
            return await this.repo.getTrash();
        } catch (err: any) {
            console.warn('[TrashService] Database unavailable, serving empty list:', err.message);
            return [];
        }
    }

    public async restoreItem(collection: string, id: number): Promise<any> {
        const normalized = normalizeCollection(collection);
        if (!VALID_COLLECTIONS.includes(normalized)) {
            throw new Error(`Invalid trash collection: ${collection}. Allowed: ${VALID_COLLECTIONS.join(', ')}`);
        }
        if (!id || id <= 0) {
            throw new Error('Invalid record ID provided.');
        }

        const restored = await this.repo.restore(normalized, id);
        if (!restored) {
            throw new Error(`Record ${id} not found in collection ${collection}`);
        }
        return restored;
    }

    public async permanentlyDeleteItem(collection: string, id: number): Promise<boolean> {
        const normalized = normalizeCollection(collection);
        if (!VALID_COLLECTIONS.includes(normalized)) {
            throw new Error(`Invalid trash collection: ${collection}. Allowed: ${VALID_COLLECTIONS.join(', ')}`);
        }
        if (!id || id <= 0) {
            throw new Error('Invalid record ID provided.');
        }

        return this.repo.permanentDelete(normalized, id);
    }

    public async emptyAllTrash(): Promise<{ count: number; total: number; details: Record<string, number> }> {
        return this.repo.emptyTrash();
    }
}

export const trashService = new TrashService();
