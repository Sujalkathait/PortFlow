import { Request, Response } from 'express';
import { shipsRepository } from '../repositories/ships.repository';
import { AuthenticatedRequest } from '../middleware/auth';

const getUser = (req: AuthenticatedRequest) => req.user?.email || (req.headers['x-user-email'] as string) || 'unknown';

/** GET /api/ships */
export const getShips = async (_req: Request, res: Response): Promise<void> => {
    try {
        const ships = await shipsRepository.findActive();
        res.status(200).json(ships);
    } catch (error: any) {
        console.error('[ShipsController] getShips error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve ships.' });
    }
};

/** GET /api/ships/:id */
export const getShipById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'Invalid ship ID' });
            return;
        }
        const ship = await shipsRepository.findById(id);
        if (!ship) {
            res.status(404).json({ success: false, message: 'Ship not found' });
            return;
        }
        res.status(200).json(ship);
    } catch (error: any) {
        console.error('[ShipsController] getShipById error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve ship.' });
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
        const ship = await shipsRepository.create({
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
        res.status(500).json({ success: false, message: 'Failed to register ship.' });
    }
};

/** PUT /api/ships/:id */
export const updateShip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'Invalid ship ID' });
            return;
        }
        const updated = await shipsRepository.update(id, req.body);
        if (!updated) {
            res.status(404).json({ success: false, message: 'Ship not found' });
            return;
        }
        res.status(200).json(updated);
    } catch (error: any) {
        console.error('[ShipsController] updateShip error:', error);
        res.status(500).json({ success: false, message: 'Failed to update ship.' });
    }
};

/** DELETE /api/ships/:id — soft delete */
export const deleteShip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'Invalid ship ID' });
            return;
        }
        const deleted = await shipsRepository.softDelete(id, getUser(req));
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Ship not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Ship moved to trash', data: deleted });
    } catch (error: any) {
        console.error('[ShipsController] deleteShip error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete ship.' });
    }
};

