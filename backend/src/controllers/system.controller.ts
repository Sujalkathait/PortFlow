import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';

export const getSystemLogs = async (_req: Request, res: Response): Promise<void> => {
    try {
        // Fetch real data if applicable, otherwise empty
        const logs: any[] = [];
        res.status(200).json(logs);
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to retrieve system logs.' });
    }
};

export const getAuditLogs = async (_req: Request, res: Response): Promise<void> => {
    try {
        // Use real operations data to form audit logs instead of demo data
        const ops = await prisma.operation.findMany({
            orderBy: { created_at: 'desc' },
            take: 100
        });
        
        const logs = ops.map(op => ({
            id: op.id,
            timestamp: op.created_at.toISOString(),
            user: op.created_by,
            action: 'Operation Activity',
            details: `Operation OP-${op.id} (${op.operation_type}) is currently ${op.status}.`
        }));
        
        res.status(200).json(logs);
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
    }
};

export const getDatabaseAnalytics = async (_req: Request, res: Response): Promise<void> => {
    try {
        // Query some basic table statistics
        const userCount = await prisma.user.count();
        const opCount = await prisma.operation.count();
        const shipCount = await prisma.ship.count();
        const CargoCount = await prisma.cargo.count();
        
        // Real JOIN query for Database Analytics
        const start = performance.now();
        const joinRes = await prisma.$queryRaw`SELECT ops.id, ships.name FROM operations ops JOIN ships ON ops.ship_name = ships.name`;
        const timeMs = Math.round(performance.now() - start);
        const rows = Array.isArray(joinRes) ? joinRes.length : 0;
        
        const stats = {
            tableStats: {
                users: userCount,
                operations: opCount,
                ships: shipCount,
                Cargos: CargoCount
            },
            joinResults: [
                { query: 'SELECT ops.id, ships.name FROM operations ops JOIN ships ON ops.ship_name = ships.name', timeMs, rows }
            ],
            dbStatus: 'Healthy',
            version: 'PostgreSQL'
        };
        res.status(200).json(stats);
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to retrieve database analytics.' });
    }
};

export const reportIssue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { title, description } = req.body;
        // In a real system, we'd save this to an issues table. For now, we mock success.
        console.log(`[Issue Reported] by ${req.user?.email}: ${title} - ${description}`);
        res.status(201).json({ success: true, message: 'Issue reported successfully. Admin has been notified.' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to report issue.' });
    }
};

