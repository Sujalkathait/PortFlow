import { Request, Response } from 'express';
import { equipmentRepository } from '../repositories/equipment.repository';
import { AuthenticatedRequest } from '../middleware/auth';

const getUser = (req: AuthenticatedRequest) => req.user?.email || (req.headers['x-user-email'] as string) || 'unknown';

/** GET /api/equipment */
export const getEquipments = async (_req: Request, res: Response): Promise<void> => {
    try {
        const Equipments = await equipmentRepository.findActive();
        res.status(200).json(Equipments);
    } catch (error: any) {
        console.error('[EquipmentController] getEquipments error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve Equipments.' });
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
        const validTypes = ['Berth', 'Crane', 'Truck', 'Warehouse'];
        if (!validTypes.includes(type)) {
            res.status(400).json({
                success: false,
                message: `Type must be one of: ${validTypes.join(', ')}`,
            });
            return;
        }
        const r = await equipmentRepository.create({
            equipment_id,
            name: String(name).trim(),
            type,
            status,
            created_by: getUser(req),
        });
        res.status(201).json(r);
    } catch (error: any) {
        console.error('[EquipmentController] createEquipment error:', error);
        res.status(500).json({ success: false, message: 'Failed to create Equipment.' });
    }
};

/** PUT /api/equipment/:id */
export const updateEquipment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'Invalid Equipment ID' });
            return;
        }
        const updated = await equipmentRepository.update(id, req.body);
        if (!updated) {
            res.status(404).json({ success: false, message: 'Equipment not found' });
            return;
        }
        res.status(200).json(updated);
    } catch (error: any) {
        console.error('[EquipmentController] updateEquipment error:', error);
        res.status(500).json({ success: false, message: 'Failed to update Equipment.' });
    }
};

/** DELETE /api/equipment/:id — soft delete */
export const deleteEquipment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'Invalid Equipment ID' });
            return;
        }
        const deleted = await equipmentRepository.softDelete(id, getUser(req));
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Equipment not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Equipment moved to trash', data: deleted });
    } catch (error: any) {
        console.error('[EquipmentController] deleteEquipment error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete Equipment.' });
    }
};



