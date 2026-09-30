import { api } from '../../../lib/api';
import type {
    OperationRecord,
    CreateOperationFormInput,
    UpdateOperationStatusInput,
    DispatchProcessResult
} from '../types/operation.types';

export interface IFrontendOperationsService {
    list(): Promise<OperationRecord[]>;
    getById(id: number): Promise<OperationRecord>;
    create(data: CreateOperationFormInput): Promise<OperationRecord>;
    update(id: number, data: UpdateOperationStatusInput): Promise<OperationRecord>;
    delete(id: number): Promise<any>;
    dispatch(): Promise<DispatchProcessResult>;
}

export class FrontendOperationsService implements IFrontendOperationsService {
    async list(): Promise<OperationRecord[]> {
        return api.operations.list();
    }

    async getById(id: number): Promise<OperationRecord> {
        return api.operations.get(id);
    }

    async create(data: CreateOperationFormInput): Promise<OperationRecord> {
        return api.operations.create(data);
    }

    async update(id: number, data: UpdateOperationStatusInput): Promise<OperationRecord> {
        return api.operations.update(id, data);
    }

    async delete(id: number): Promise<any> {
        return api.operations.delete(id);
    }

    async dispatch(): Promise<DispatchProcessResult> {
        return api.operations.dispatch();
    }
}

export const operationsService = new FrontendOperationsService();
