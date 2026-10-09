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
import { register, login, getMe, deleteAccount, forgotPassword, verifyOTP, resetPassword } from '../controllers/auth.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { getSystemLogs, getAuditLogs, getDatabaseAnalytics, reportIssue } from '../controllers/system.controller';
import { getTrash, restoreItem, emptyTrash, permanentDeleteItem } from '../controllers/trash.controller';

export const apiRouter = Router();

const isDev = process.env.NODE_ENV !== 'production';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 1000 : 300, // Generous limit for authentication
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts. Please wait a moment and try again.' },
});

// ─── Authentication & Password Recovery Endpoints ───
apiRouter.post('/auth/register', authLimiter, register);
apiRouter.post('/auth/login', authLimiter, login);
apiRouter.post('/auth/forgot-password', authLimiter, forgotPassword);
apiRouter.post('/auth/verify-otp', authLimiter, verifyOTP);
apiRouter.post('/auth/reset-password', authLimiter, resetPassword);
apiRouter.get('/auth/me', requireAuth, getMe);
apiRouter.delete('/auth/account', requireAuth, deleteAccount);

// ─── Operations CRUD ───
apiRouter.get('/operations', requireAuth, getOperations);
apiRouter.get('/operations/:id', requireAuth, getOperationById);
apiRouter.post('/operations', requireAuth, startOperation);
apiRouter.put('/operations/:id', requireAuth, updateOperation);
apiRouter.patch('/operations/:id', requireAuth, updateOperation);
apiRouter.delete('/operations/:id', requireAuth, deleteOperation);

// ─── OS Scheduling & Telemetry ───
apiRouter.post('/operations/dispatch', requireAuth, dispatchNext);
apiRouter.get('/os/state', requireAuth, getOSState); // Both Admin & Operator can monitor scheduler, queues, and locks
apiRouter.put('/os/algorithm', requireAuth, setOSAlgorithm);

// ─── Ships CRUD ───
apiRouter.get('/ships', requireAuth, getShips);
apiRouter.get('/ships/:id', requireAuth, getShipById);
apiRouter.post('/ships', requireAuth, createShip);
apiRouter.put('/ships/:id', requireAuth, updateShip);
apiRouter.patch('/ships/:id', requireAuth, updateShip);
apiRouter.delete('/ships/:id', requireAuth, deleteShip);

// ─── Cargos CRUD ───
apiRouter.get('/cargos', requireAuth, getCargos);
apiRouter.post('/cargos', requireAuth, createCargo);
apiRouter.put('/cargos/:id', requireAuth, updateCargo);
apiRouter.patch('/cargos/:id', requireAuth, updateCargo);
apiRouter.delete('/cargos/:id', requireAuth, deleteCargo);

// ─── Equipments CRUD ───
apiRouter.get('/equipments', requireAuth, getEquipments);
apiRouter.post('/equipments', requireAuth, createEquipment);
apiRouter.put('/equipments/:id', requireAuth, updateEquipment);
apiRouter.patch('/equipments/:id', requireAuth, updateEquipment);
apiRouter.delete('/equipments/:id', requireAuth, deleteEquipment);

// ─── Analytics & System ───
apiRouter.get('/analytics', requireAuth, getAnalytics);
apiRouter.get('/system/logs', requireAuth, getSystemLogs);
apiRouter.get('/system/audit', requireAuth, getAuditLogs);
apiRouter.get('/system/db-analytics', requireAuth, getDatabaseAnalytics);
apiRouter.get('/system/reports', requireAuth, getDatabaseAnalytics);
apiRouter.post('/system/report-issue', requireAuth, reportIssue);

// ─── Trash & Recovery Bin ───
apiRouter.get('/trash', requireAuth, getTrash);
apiRouter.post('/trash/restore/:collection/:id', requireAuth, restoreItem);
apiRouter.delete('/trash/empty', requireAuth, emptyTrash);
apiRouter.delete('/trash/:collection/:id', requireAuth, permanentDeleteItem);


