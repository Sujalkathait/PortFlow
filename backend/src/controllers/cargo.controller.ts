import { Request, Response } from 'express';
import { cargoService } from '../services/cargo.service';
import { AuthenticatedRequest } from '../middleware/auth';

const getUser = (req: AuthenticatedRequest) => req.user?.email || 'unknown';

const getRecordId = (value: string | string[]): number | null => {
    if (Array.isArray(value)) return null;
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

/** GET /api/cargo */
export const getCargos = async (_req: Request, res: Response): Promise<void> => {
    try {
        const Cargos = await cargoService.getCargos();
        res.status(200).json(Cargos);
    } catch (error: any) {
        console.error('[CargoController] getCargos error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to retrieve Cargos.' });
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
        const c = await cargoService.createCargo({
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
        res.status(400).json({ success: false, message: error.message || 'Failed to create Cargo.' });
    }
};

/** PUT /api/cargo/:id */
export const updateCargo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = getRecordId(req.params.id);
        if (id === null) {
            res.status(400).json({ success: false, message: 'Invalid Cargo ID' });
            return;
        }
        const { cargo_number, size_type, weight_tons, cargo_type, current_location, ship_name, status } = req.body;
        
        if (weight_tons !== undefined && (typeof weight_tons !== 'number' || weight_tons < 0)) {
            res.status(400).json({ success: false, message: 'weight_tons must be a positive number' });
            return;
        }

        const validStatuses = ['In Yard', 'Loaded', 'Discharged'];
        if (status !== undefined && !validStatuses.includes(status)) {
            res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
            return;
        }

        const updated = await cargoService.updateCargo(id, { cargo_number, size_type, weight_tons, cargo_type, current_location, ship_name, status });
        if (!updated) {
            res.status(404).json({ success: false, message: 'Cargo not found' });
            return;
        }
        res.status(200).json(updated);
    } catch (error: any) {
        console.error('[CargoController] updateCargo error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update Cargo.' });
    }
};

/** DELETE /api/cargo/:id — soft delete */
export const deleteCargo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = getRecordId(req.params.id);
        if (id === null) {
            res.status(400).json({ success: false, message: 'Invalid Cargo ID' });
            return;
        }
        const deleted = await cargoService.deleteCargo(id, getUser(req));
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Cargo not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Cargo moved to trash', data: deleted });
    } catch (error: any) {
        console.error('[CargoController] deleteCargo error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to delete Cargo.' });
    }
};
