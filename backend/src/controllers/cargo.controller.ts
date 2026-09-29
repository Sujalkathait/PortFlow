import { Request, Response } from 'express';
import { cargoRepository } from '../repositories/cargo.repository';
import { AuthenticatedRequest } from '../middleware/auth';

const getUser = (req: AuthenticatedRequest) => req.user?.email || (req.headers['x-user-email'] as string) || 'unknown';

/** GET /api/cargo */
export const getCargos = async (_req: Request, res: Response): Promise<void> => {
    try {
        const Cargos = await cargoRepository.findActive();
        res.status(200).json(Cargos);
    } catch (error: any) {
        console.error('[CargoController] getCargos error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve Cargos.' });
    }
};

/** POST /api/cargo */
export const createCargo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { cargo_number, size_type, weight_tons, cargo_type, current_location, ship_name } = req.body;
        if (!cargo_number || typeof cargo_number !== 'string' || !cargo_number.trim()) {
            res.status(400).json({ success: false, message: 'Cargo number is required.' });
            return;
        }
        const c = await cargoRepository.create({
            cargo_number: cargo_number.trim(),
            size_type,
            weight_tons: Number(weight_tons) || 0,
            cargo_type,
            current_location,
            ship_name,
            created_by: getUser(req),
        });
        res.status(201).json(c);
    } catch (error: any) {
        console.error('[CargoController] createCargo error:', error);
        res.status(500).json({ success: false, message: 'Failed to create Cargo.' });
    }
};

/** PUT /api/cargo/:id */
export const updateCargo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'Invalid Cargo ID' });
            return;
        }
        const updated = await cargoRepository.update(id, req.body);
        if (!updated) {
            res.status(404).json({ success: false, message: 'Cargo not found' });
            return;
        }
        res.status(200).json(updated);
    } catch (error: any) {
        console.error('[CargoController] updateCargo error:', error);
        res.status(500).json({ success: false, message: 'Failed to update Cargo.' });
    }
};

/** DELETE /api/cargo/:id — soft delete */
export const deleteCargo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'Invalid Cargo ID' });
            return;
        }
        const deleted = await cargoRepository.softDelete(id, getUser(req));
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Cargo not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Cargo moved to trash', data: deleted });
    } catch (error: any) {
        console.error('[CargoController] deleteCargo error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete Cargo.' });
    }
};



