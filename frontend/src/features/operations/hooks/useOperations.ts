import { useState, useCallback, useEffect } from 'react';
import { operationsService } from '../services/operations.service';
import type { IFrontendOperationsService } from '../services/operations.service';
import type {
    OperationRecord,
    CreateOperationFormInput,
} from '../types/operation.types';

export function useOperations(service: IFrontendOperationsService = operationsService) {
    const [operations, setOperations] = useState<OperationRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    const clearMessages = useCallback(() => {
        setError('');
        setSuccess('');
    }, []);

    const fetchOperations = useCallback(async () => {
        setLoading(true);
        clearMessages();
        try {
            const data = await service.list();
            setOperations(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load operations.');
        } finally {
            setLoading(false);
        }
    }, [service, clearMessages]);

    useEffect(() => {
        void fetchOperations();
    }, [fetchOperations]);

    const createOperation = useCallback(async (input: CreateOperationFormInput): Promise<boolean> => {
        setSubmitting(true);
        clearMessages();
        try {
            await service.create(input);
            setSuccess('Operation successfully created and submitted to the scheduler queue.');
            await fetchOperations();
            return true;
        } catch (err: any) {
            setError(err.message || 'Failed to create operation.');
            return false;
        } finally {
            setSubmitting(false);
        }
    }, [service, clearMessages, fetchOperations]);

    const updateStatus = useCallback(async (id: number, status: string): Promise<boolean> => {
        clearMessages();
        try {
            await service.update(id, { status });
            setSuccess(`Operation OP-${id} updated to ${status}.`);
            await fetchOperations();
            return true;
        } catch (err: any) {
            setError(err.message || 'Failed to update operation.');
            return false;
        }
    }, [service, clearMessages, fetchOperations]);

    const deleteOperation = useCallback(async (id: number): Promise<boolean> => {
        clearMessages();
        try {
            await service.delete(id);
            setSuccess(`Operation OP-${id} moved to Trash Bin.`);
            await fetchOperations();
            return true;
        } catch (err: any) {
            setError(err.message || 'Failed to delete operation.');
            return false;
        }
    }, [service, clearMessages, fetchOperations]);

    const dispatchNextProcess = useCallback(async (): Promise<boolean> => {
        clearMessages();
        try {
            const result = await service.dispatch();
            if (result.dispatched) {
                setSuccess(`Process dispatched via FCFS scheduler — Operation OP-${result.dispatched} completed.`);
            } else {
                setError('No processes in ready queue to dispatch.');
            }
            await fetchOperations();
            return true;
        } catch (err: any) {
            setError(err.message || 'Dispatch failed.');
            return false;
        }
    }, [service, clearMessages, fetchOperations]);

    const queuedCount = operations.filter(o => o.status === 'Queued').length;
    const runningCount = operations.filter(o => o.status === 'Running').length;
    const completedCount = operations.filter(o => o.status === 'Completed').length;

    return {
        operations,
        loading,
        submitting,
        error,
        success,
        queuedCount,
        runningCount,
        completedCount,
        clearMessages,
        refresh: fetchOperations,
        createOperation,
        updateStatus,
        deleteOperation,
        dispatchNextProcess,
    };
}
