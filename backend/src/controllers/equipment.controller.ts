import { Request, Response } from 'express';
import { equipmentService } from '../services/equipment.service';
import { AuthenticatedRequest } from '../middleware/auth';

const getUser = (req: AuthenticatedRequest) => req.user?.email || 'unknown';

const getRecordId = (value: string | string[]): number | null => {
    if (Array.isArray(value)) return null;
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

/** GET /api/equipment */
export const getEquipments = async (_req: Request, res: Response): Promise<void> => {
    try {
        const Equipments = await equipmentService.getEquipments();
        res.status(200).json(Equipments);
    } catch (error: any) {
        console.error('[EquipmentController] getEquipments error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to retrieve Equipments.' });
    }
};

/** POST /api/equipment */
export const createEquipment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { equipment_id, name, type, status } = req.body;
        if (!name || !type) {
            res.status(400).json({ success: false, message: 'Equipment name and type are required.' });
            return;
        }

        const r = await equipmentService.createEquipment({
            equipment_id,
            name: String(name).trim(),
            type,
            status,
            created_by: getUser(req),
        });

        res.status(201).json(r);
    } catch (error: any) {
        console.error('[EquipmentController] createEquipment error:', error);
        res.status(400).json({ success: false, message: error.message || 'Failed to create Equipment.' });
    }
};

/** PUT /api/equipment/:id */
export const updateEquipment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = getRecordId(req.params.id);
        if (id === null) {
            res.status(400).json({ success: false, message: 'Invalid Equipment ID' });
            return;
        }

        const { name, status, type, assigned_to } = req.body;

        const validStatuses = ['Available', 'In Use', 'Maintenance', 'Decommissioned'];
        if (status !== undefined && !validStatuses.includes(status)) {
            res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
            return;
        }

        if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
            res.status(400).json({ success: false, message: 'Invalid name' });
            return;
        }

        const updated = await equipmentService.updateEquipment(id, { name, status, type, assigned_to });
        if (!updated) {
            res.status(404).json({ success: false, message: 'Equipment not found' });
            return;
        }
        res.status(200).json(updated);
    } catch (error: any) {
        console.error('[EquipmentController] updateEquipment error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update Equipment.' });
    }
};

/** DELETE /api/equipment/:id — soft delete */
export const deleteEquipment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = getRecordId(req.params.id);
        if (id === null) {
            res.status(400).json({ success: false, message: 'Invalid Equipment ID' });
            return;
        }
        const deleted = await equipmentService.deleteEquipment(id, getUser(req));
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Equipment not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Equipment moved to trash', data: deleted });
    } catch (error: any) {
        console.error('[EquipmentController] deleteEquipment error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to delete Equipment.' });
    }
};
