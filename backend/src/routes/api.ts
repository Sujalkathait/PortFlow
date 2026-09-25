import { Router } from 'express';
import {
    getOperations,
    startOperation,
    updateOperation,
    deleteOperation,
    dispatchNext,
    getOSState
} from '../controllers/operations.controller';

export const apiRouter = Router();

// CRUD operations routes
apiRouter.get('/operations', getOperations);
apiRouter.post('/operations', startOperation);
apiRouter.put('/operations/:id', updateOperation);
apiRouter.delete('/operations/:id', deleteOperation);
apiRouter.post('/operations/dispatch', dispatchNext);

// OS Telemetry and Concurrency State
apiRouter.get('/os/state', getOSState);
