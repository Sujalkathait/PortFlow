import { Router } from 'express';
import {
    getOperations, getOperationById, startOperation,
    updateOperation, deleteOperation, dispatchNext,
    getOSState, getAnalytics, setOSAlgorithm
} from '../controllers/operations.controller';
import { getShips, getShipById, createShip, updateShip, deleteShip } from '../controllers/ships.controller';
import { getCargos, createCargo, updateCargo, deleteCargo } from '../controllers/cargo.controller';
import { getEquipments, createEquipment, updateEquipment, deleteEquipment } from '../controllers/equipment.controller';
import { getTrash, restoreFromTrash, permanentDelete, emptyTrash } from '../controllers/trash.controller';
import { register, login, getMe } from '../controllers/auth.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { getSystemLogs, getAuditLogs, getDatabaseAnalytics, reportIssue } from '../controllers/system.controller';

export const apiRouter = Router();

// ─── Authentication Endpoints ───
apiRouter.post('/auth/register', register);
apiRouter.post('/auth/login', login);
apiRouter.get('/auth/me', requireAuth, getMe);

// ─── Operations CRUD ───
apiRouter.get('/operations', requireAuth, getOperations);
apiRouter.get('/operations/:id', requireAuth, getOperationById);
apiRouter.post('/operations', requireAuth, startOperation);
apiRouter.put('/operations/:id', requireAuth, updateOperation);
apiRouter.delete('/operations/:id', requireAuth, requireRole(['Admin']), deleteOperation);

// ─── OS Scheduling & Telemetry ───
apiRouter.post('/operations/dispatch', requireAuth, requireRole(['Admin']), dispatchNext);
apiRouter.get('/os/state', requireAuth, getOSState); // Both Admin & Operator can monitor scheduler, queues, and locks
apiRouter.put('/os/algorithm', requireAuth, requireRole(['Admin']), setOSAlgorithm);

// ─── Ships CRUD ───
apiRouter.get('/ships', requireAuth, getShips);
apiRouter.get('/ships/:id', requireAuth, getShipById);
apiRouter.post('/ships', requireAuth, requireRole(['Admin']), createShip);
apiRouter.put('/ships/:id', requireAuth, updateShip);
apiRouter.delete('/ships/:id', requireAuth, requireRole(['Admin']), deleteShip);

// ─── Cargos CRUD ───
apiRouter.get('/Cargos', requireAuth, getCargos);
apiRouter.post('/Cargos', requireAuth, requireRole(['Admin']), createCargo);
apiRouter.put('/Cargos/:id', requireAuth, updateCargo);
apiRouter.delete('/Cargos/:id', requireAuth, requireRole(['Admin']), deleteCargo);

// ─── Equipments CRUD ───
apiRouter.get('/Equipments', requireAuth, getEquipments);
apiRouter.post('/Equipments', requireAuth, requireRole(['Admin']), createEquipment);
apiRouter.put('/Equipments/:id', requireAuth, requireRole(['Admin']), updateEquipment);
apiRouter.delete('/Equipments/:id', requireAuth, requireRole(['Admin']), deleteEquipment);

// ─── Analytics & System ───
apiRouter.get('/analytics', requireAuth, getAnalytics);
apiRouter.get('/system/logs', requireAuth, requireRole(['Admin']), getSystemLogs);
apiRouter.get('/system/audit', requireAuth, requireRole(['Admin']), getAuditLogs);
apiRouter.get('/system/db-analytics', requireAuth, requireRole(['Admin']), getDatabaseAnalytics);
apiRouter.get('/system/reports', requireAuth, getDatabaseAnalytics);
apiRouter.post('/system/report-issue', requireAuth, reportIssue);

// ─── Trash Bin (Soft-Delete Recovery & Purge) ───
apiRouter.get('/trash', requireAuth, requireRole(['Admin']), getTrash);
apiRouter.post('/trash/:collection/:id/restore', requireAuth, requireRole(['Admin']), restoreFromTrash);
apiRouter.delete('/trash/:collection/:id', requireAuth, requireRole(['Admin']), permanentDelete);
apiRouter.delete('/trash', requireAuth, requireRole(['Admin']), emptyTrash);


