import { Request, Response } from 'express';
import { OperationsService } from '../services/operations.service';
import { PortSystem } from '../os/PortSystem';
import { AuthenticatedRequest } from '../middleware/auth';

const operationsService = new OperationsService();

const getUser = (req: AuthenticatedRequest) => req.user?.email || 'unknown';

const getRecordId = (value: string | string[]): number | null => {
    if (Array.isArray(value)) return null;
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

/** GET /api/operations — list all active operations */
export const getOperations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        let ops = await operationsService.getOperations();
        
        // Terminal Operator: My Jobs - View only assigned operations
        if (req.user && req.user.role === 'Operator') {
            ops = ops.filter(op => op.created_by === req.user!.email);
        }
        
        res.status(200).json(ops);
    } catch (error: any) {
        console.error('[OperationsController] getOperations error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve operations.' });
    }
};

/** GET /api/operations/:id — get single operation */
export const getOperationById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = getRecordId(req.params.id);
        if (id === null) {
            res.status(400).json({ success: false, message: 'Invalid operation ID' });
            return;
        }
        const op = await operationsService.getOperationById(id);
        if (!op) {
            res.status(404).json({ success: false, message: 'Operation not found' });
            return;
        }
        res.status(200).json(op);
    } catch (error: any) {
        console.error('[OperationsController] getOperationById error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve operation.' });
    }
};

/** POST /api/operations — create new operation */
export const startOperation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { operationType, shipName, craneId, berthId, priority, burstDuration } = req.body;
        if (!operationType || !shipName) {
            res.status(400).json({ success: false, message: 'Operation type and ship name are required.' });
            return;
        }
        const result = await operationsService.submitOperation({
            operationType: String(operationType).trim(),
            shipName: String(shipName).trim(),
            craneId,
            berthId,
            priority,
            burstDuration,
            created_by: getUser(req),
        });
        res.status(201).json(result);
    } catch (error: any) {
        console.error('[OperationsController] startOperation error:', error);
        res.status(500).json({ success: false, message: 'Failed to create operation.' });
    }
};

/** PUT /api/operations/:id — update operation */
export const updateOperation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = getRecordId(req.params.id);
        if (id === null) {
            res.status(400).json({ success: false, message: 'Invalid operation ID' });
            return;
        }
        const updated = await operationsService.updateOperation(id, req.body);
        if (!updated) {
            res.status(404).json({ success: false, message: `Operation ${id} not found` });
            return;
        }
        res.status(200).json(updated);
    } catch (error: any) {
        console.error('[OperationsController] updateOperation error:', error);
        res.status(500).json({ success: false, message: 'Failed to update operation.' });
    }
};

/** DELETE /api/operations/:id — soft-delete operation */
export const deleteOperation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = getRecordId(req.params.id);
        if (id === null) {
            res.status(400).json({ success: false, message: 'Invalid operation ID' });
            return;
        }
        const deleted = await operationsService.deleteOperation(id, getUser(req));
        if (!deleted) {
            res.status(404).json({ success: false, message: `Operation ${id} not found` });
            return;
        }
        res.status(200).json({ success: true, message: `Operation ${id} moved to trash`, data: deleted });
    } catch (error: any) {
        console.error('[OperationsController] deleteOperation error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete operation.' });
    }
};

/** POST /api/operations/dispatch — dispatch next FCFS process */
export const dispatchNext = async (_req: Request, res: Response): Promise<void> => {
    try {
        const result = await operationsService.dispatchNext();
        if (!result) {
            res.status(200).json({ dispatched: null, message: 'No processes in ready queue' });
            return;
        }
        res.status(200).json({
            dispatched: result.operationId,
            process: {
                id: result.process.id,
                burstTime: result.process.burstTime,
                waitingTime: result.process.waitingTime,
                turnaroundTime: result.process.turnaroundTime,
            },
        });
    } catch (error: any) {
        console.error('[OperationsController] dispatchNext error:', error);
        res.status(500).json({ success: false, message: 'Failed to dispatch next process.' });
    }
};

/** GET /api/os/state — OS engine telemetry */
export const getOSState = async (_req: Request, res: Response): Promise<void> => {
    try {
        const state = PortSystem.getInstance().getSystemState();
        const metrics = await operationsService.getMetrics();
        res.status(200).json({ ...state, metrics });
    } catch (error: any) {
        console.error('[OperationsController] getOSState error:', error);
        res.status(500).json({ success: false, message: 'Failed to query OS state.' });
    }
};

/** PUT /api/os/algorithm — set OS scheduling algorithm */
export const setOSAlgorithm = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { algorithm } = req.body;
        const valid = ['FCFS', 'SJF', 'PRIORITY'];
        if (!valid.includes(algorithm)) {
            res.status(400).json({ success: false, message: 'Invalid algorithm. Must be FCFS, SJF, or PRIORITY.' });
            return;
        }
        PortSystem.getInstance().setSchedulingAlgorithm(algorithm as any);
        res.status(200).json({ success: true, message: `Algorithm updated to ${algorithm}` });
    } catch (error: any) {
        console.error('[OperationsController] setOSAlgorithm error:', error);
        res.status(500).json({ success: false, message: 'Failed to update OS algorithm.' });
    }
};

/** GET /api/analytics — dashboard analytics from real data */
export const getAnalytics = async (_req: Request, res: Response): Promise<void> => {
    try {
        const metrics = await operationsService.getMetrics();
        res.status(200).json(metrics);
    } catch (error: any) {
        console.error('[OperationsController] getAnalytics error:', error);
        res.status(500).json({ success: false, message: 'Failed to load analytics.' });
    }
};

