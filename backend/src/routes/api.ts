import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    getOperations, getOperationById, startOperation,
    updateOperation, deleteOperation, dispatchNext,
    getOSState, getAnalytics, setOSAlgorithm
} from '../controllers/operations.controller';
import { getShips, getShipById, createShip, updateShip, deleteShip } from '../controllers/ships.controller';
import { getCargos, createCargo, updateCargo, deleteCargo } from '../controllers/cargo.controller';
import { getEquipments, createEquipment, updateEquipment, deleteEquipment } from '../controllers/equipment.controller';
import { register, login, getMe } from '../controllers/auth.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { getSystemLogs, getAuditLogs, getDatabaseAnalytics, reportIssue } from '../controllers/system.controller';

export const apiRouter = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per `window` for auth endpoints
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Authentication Endpoints ───
apiRouter.post('/auth/register', authLimiter, register);
apiRouter.post('/auth/login', authLimiter, login);
apiRouter.get('/auth/me', requireAuth, getMe);

// ─── Operations CRUD ───
apiRouter.get('/operations', requireAuth, getOperations);
apiRouter.get('/operations/:id', requireAuth, getOperationById);
apiRouter.post('/operations', requireAuth, startOperation);
apiRouter.patch('/operations/:id', requireAuth, updateOperation);
apiRouter.delete('/operations/:id', requireAuth, requireRole(['Admin']), deleteOperation);

// ─── OS Scheduling & Telemetry ───
apiRouter.post('/operations/dispatch', requireAuth, requireRole(['Admin']), dispatchNext);
apiRouter.get('/os/state', requireAuth, getOSState); // Both Admin & Operator can monitor scheduler, queues, and locks
apiRouter.put('/os/algorithm', requireAuth, requireRole(['Admin']), setOSAlgorithm);

// ─── Ships CRUD ───
apiRouter.get('/ships', requireAuth, getShips);
apiRouter.get('/ships/:id', requireAuth, getShipById);
apiRouter.post('/ships', requireAuth, requireRole(['Admin']), createShip);
apiRouter.patch('/ships/:id', requireAuth, requireRole(['Admin']), updateShip);
apiRouter.delete('/ships/:id', requireAuth, requireRole(['Admin']), deleteShip);

// ─── Cargos CRUD ───
apiRouter.get('/cargos', requireAuth, getCargos);
apiRouter.post('/cargos', requireAuth, requireRole(['Admin']), createCargo);
apiRouter.patch('/cargos/:id', requireAuth, requireRole(['Admin']), updateCargo);
apiRouter.delete('/cargos/:id', requireAuth, requireRole(['Admin']), deleteCargo);

// ─── Equipments CRUD ───
apiRouter.get('/equipments', requireAuth, getEquipments);
apiRouter.post('/equipments', requireAuth, requireRole(['Admin']), createEquipment);
apiRouter.patch('/equipments/:id', requireAuth, requireRole(['Admin']), updateEquipment);
apiRouter.delete('/equipments/:id', requireAuth, requireRole(['Admin']), deleteEquipment);

// ─── Analytics & System ───
apiRouter.get('/analytics', requireAuth, getAnalytics);
apiRouter.get('/system/logs', requireAuth, requireRole(['Admin']), getSystemLogs);
apiRouter.get('/system/audit', requireAuth, requireRole(['Admin']), getAuditLogs);
apiRouter.get('/system/db-analytics', requireAuth, requireRole(['Admin']), getDatabaseAnalytics);
apiRouter.get('/system/reports', requireAuth, getDatabaseAnalytics);
apiRouter.post('/system/report-issue', requireAuth, reportIssue);


