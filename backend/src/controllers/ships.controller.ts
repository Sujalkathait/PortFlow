import { Request, Response } from 'express';
import { shipsService } from '../services/ships.service';
import { AuthenticatedRequest } from '../middleware/auth';

const getUser = (req: AuthenticatedRequest) => req.user?.email || 'unknown';

const getRecordId = (value: string | string[]): number | null => {
    if (Array.isArray(value)) return null;
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

/** GET /api/ships */
export const getShips = async (_req: Request, res: Response): Promise<void> => {
    try {
        const ships = await shipsService.getShips();
        res.status(200).json(ships);
    } catch (error: any) {
        console.error('[ShipsController] getShips error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to retrieve ships.' });
    }
};

/** GET /api/ships/:id */
export const getShipById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = getRecordId(req.params.id);
        if (id === null) {
            res.status(400).json({ success: false, message: 'Invalid ship ID' });
            return;
        }
        const ship = await shipsService.getShipById(id);
        if (!ship) {
            res.status(404).json({ success: false, message: 'Ship not found' });
            return;
        }
        res.status(200).json(ship);
    } catch (error: any) {
        console.error('[ShipsController] getShipById error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to retrieve ship.' });
    }
};

/** POST /api/ships */
export const createShip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { imo_number, name, vessel_type, capacity_teu, berth_id } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            res.status(400).json({ success: false, message: 'Ship name is required.' });
            return;
        }
        const ship = await shipsService.createShip({
            name: name.trim(),
            imo_number: imo_number ? String(imo_number).trim() : undefined,
            vessel_type,
            capacity_teu: Number(capacity_teu) || 0,
            berth_id,
            created_by: getUser(req),
        });
        res.status(201).json(ship);
    } catch (error: any) {
        console.error('[ShipsController] createShip error:', error);
        res.status(400).json({ success: false, message: error.message || 'Failed to register ship.' });
    }
};

/** PUT /api/ships/:id */
export const updateShip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = getRecordId(req.params.id);
        if (id === null) {
            res.status(400).json({ success: false, message: 'Invalid ship ID' });
            return;
        }
        const { name, status, vessel_type, capacity_teu, berth_id } = req.body;
        
        if (capacity_teu !== undefined && (typeof capacity_teu !== 'number' || capacity_teu < 0)) {
            res.status(400).json({ success: false, message: 'capacity_teu must be a positive number' });
            return;
        }

        const validStatuses = ['Arriving', 'Docked', 'Departed'];
        if (status !== undefined && !validStatuses.includes(status)) {
            res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
            return;
        }

        if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
            res.status(400).json({ success: false, message: 'Invalid name' });
            return;
        }

        const updated = await shipsService.updateShip(id, { name, status, vessel_type, capacity_teu, berth_id });
        if (!updated) {
            res.status(404).json({ success: false, message: 'Ship not found' });
            return;
        }
        res.status(200).json(updated);
    } catch (error: any) {
        console.error('[ShipsController] updateShip error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update ship.' });
    }
};

/** DELETE /api/ships/:id — soft delete */
export const deleteShip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = getRecordId(req.params.id);
        if (id === null) {
            res.status(400).json({ success: false, message: 'Invalid ship ID' });
            return;
        }
        const deleted = await shipsService.deleteShip(id, getUser(req));
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Ship not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Ship moved to trash', data: deleted });
    } catch (error: any) {
        console.error('[ShipsController] deleteShip error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to delete ship.' });
    }
};
