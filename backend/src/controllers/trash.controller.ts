import { Request, Response } from 'express';
import { trashService } from '../services/trash.service';

const getRecordId = (value: string | string[]): number | null => {
    if (Array.isArray(value)) return null;
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

/** Unified Trash Bin — returns all soft-deleted records across all collections */
export const getTrash = async (_req: Request, res: Response): Promise<void> => {
    try {
        const records = await trashService.getTrash();
        res.status(200).json(records);
    } catch (error: any) {
        console.error('[TrashController] getTrash error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to retrieve trash items.' });
    }
};

/** Restore a record from trash */
export const restoreFromTrash = async (req: Request, res: Response): Promise<void> => {
    try {
        const collection = String(req.params.collection);
        const numId = getRecordId(req.params.id);
        if (numId === null) {
            res.status(400).json({ success: false, message: 'Invalid record ID' });
            return;
        }

        const restored = await trashService.restoreItem(collection, numId);
        res.status(200).json({
            success: true,
            message: 'Record restored successfully.',
            data: restored,
        });
    } catch (error: any) {
        console.error('[TrashController] restoreFromTrash error:', error);
        res.status(400).json({ success: false, message: error.message || 'Failed to restore record.' });
    }
};

/** Permanently delete a record from trash */
export const permanentDelete = async (req: Request, res: Response): Promise<void> => {
    try {
        const collection = String(req.params.collection);
        const numId = getRecordId(req.params.id);
        if (numId === null) {
            res.status(400).json({ success: false, message: 'Invalid record ID' });
            return;
        }

        const success = await trashService.permanentlyDeleteItem(collection, numId);
        res.status(200).json({
            success,
            message: 'Record permanently purged from database.',
        });
    } catch (error: any) {
        console.error('[TrashController] permanentDelete error:', error);
        res.status(400).json({ success: false, message: error.message || 'Failed to purge record.' });
    }
};

/** Empty entire trash bin */
export const emptyTrash = async (_req: Request, res: Response): Promise<void> => {
    try {
        const result = await trashService.emptyAllTrash();
        res.status(200).json({
            success: true,
            message: `Trash emptied. ${result.count} records purged permanently.`,
            data: result,
        });
    } catch (error: any) {
        console.error('[TrashController] emptyTrash error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to empty trash.' });
    }
};
