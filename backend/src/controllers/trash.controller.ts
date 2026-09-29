import { Request, Response } from 'express';
import { trashRepository } from '../repositories/trash.repository';

/** Unified Trash Bin — returns all soft-deleted records across all collections */
export const getTrash = async (_req: Request, res: Response): Promise<void> => {
    try {
        const records = await trashRepository.getTrash();
        res.status(200).json(records);
    } catch (error: any) {
        console.error('[TrashController] getTrash error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve trash items.' });
    }
};

/** Restore a record from trash */
export const restoreFromTrash = async (req: Request, res: Response): Promise<void> => {
    try {
        const collection = String(req.params.collection);
        const numId = Number(req.params.id);
        if (isNaN(numId)) {
            res.status(400).json({ success: false, message: 'Invalid record ID' });
            return;
        }

        const validCollections = ['operations', 'ships', 'Cargos', 'Equipments'];
        if (!validCollections.includes(collection)) {
            res.status(400).json({ success: false, message: `Unknown collection: ${collection}` });
            return;
        }

        const restored = await trashRepository.restore(collection, numId);
        if (!restored) {
            res.status(404).json({ success: false, message: 'Record not found in trash.' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Record restored successfully.',
            data: restored,
        });
    } catch (error: any) {
        console.error('[TrashController] restoreFromTrash error:', error);
        res.status(500).json({ success: false, message: 'Failed to restore record.' });
    }
};

/** Permanently delete a record from trash */
export const permanentDelete = async (req: Request, res: Response): Promise<void> => {
    try {
        const collection = String(req.params.collection);
        const numId = Number(req.params.id);
        if (isNaN(numId)) {
            res.status(400).json({ success: false, message: 'Invalid record ID' });
            return;
        }

        const validCollections = ['operations', 'ships', 'Cargos', 'Equipments'];
        if (!validCollections.includes(collection)) {
            res.status(400).json({ success: false, message: `Unknown collection: ${collection}` });
            return;
        }

        const deleted = await trashRepository.permanentDelete(collection, numId);
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Record not found in trash.' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Record permanently deleted.',
        });
    } catch (error: any) {
        console.error('[TrashController] permanentDelete error:', error);
        res.status(500).json({ success: false, message: 'Failed to permanently delete record.' });
    }
};

/** Empty all trash — permanently delete ALL soft-deleted records */
export const emptyTrash = async (_req: Request, res: Response): Promise<void> => {
    try {
        const result = await trashRepository.emptyTrash();
        res.status(200).json({
            success: true,
            message: `${result.total} records permanently deleted from trash.`,
            details: result.details,
        });
    } catch (error: any) {
        console.error('[TrashController] emptyTrash error:', error);
        res.status(500).json({ success: false, message: 'Failed to empty trash.' });
    }
};

