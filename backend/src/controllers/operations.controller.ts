import { Request, Response } from 'express';
import { OperationsService } from '../services/operations.service';
import { PortSystem } from '../os/PortSystem';

const operationsService = new OperationsService();

export const getOperations = (_req: Request, res: Response) => {
    try {
        const ops = operationsService.getOperations();
        res.status(200).json(ops);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const startOperation = async (req: Request, res: Response) => {
    try {
        const { operationType, shipId, shipName, craneId, berthId, priority, burstDuration } = req.body;
        const result = await operationsService.submitOperation({
            operationType, shipId, shipName, craneId, berthId, priority, burstDuration
        });
        res.status(201).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateOperation = (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const updated = operationsService.updateOperation(id, req.body);
        if (!updated) {
            res.status(404).json({ error: `Operation ${id} not found` });
            return;
        }
        res.status(200).json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteOperation = (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const deleted = operationsService.deleteOperation(id);
        if (!deleted) {
            res.status(404).json({ error: `Operation ${id} not found` });
            return;
        }
        res.status(200).json({ message: `Operation ${id} deleted`, success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const dispatchNext = async (_req: Request, res: Response) => {
    try {
        const result = await operationsService.dispatchNext();
        res.status(200).json({ dispatched: result ? result.id : null });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getOSState = (_req: Request, res: Response) => {
    try {
        const state = PortSystem.getInstance().getSystemState();
        const metrics = operationsService.getMetrics();
        res.status(200).json({ ...state, metrics });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
