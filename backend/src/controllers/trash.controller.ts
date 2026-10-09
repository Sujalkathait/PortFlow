import { Response } from 'express';
import { trashService } from '../services/trash.service';
import { AuthenticatedRequest } from '../middleware/auth';

/** GET /api/trash — get all soft-deleted records (role-filtered for operators) */
export const getTrash = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        let items = await trashService.getTrash();

        // Operators only see their own trashed operations/cargo
        if (req.user && req.user.role === 'Operator') {
            items = items.filter(item => 
                item.created_by === req.user!.email || 
                item.deleted_by === req.user!.email
            );
        }

        res.status(200).json(items);
    } catch (err: any) {
        console.error('[TrashController] getTrash error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to retrieve trash items.' });
    }
};

/** POST /api/trash/restore/:collection/:id — restore soft-deleted item */
export const restoreItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const collection = String(req.params.collection);
        const recordId = Number(req.params.id);

        if (!collection || !recordId || isNaN(recordId)) {
            res.status(400).json({ success: false, message: 'Valid collection and record ID required.' });
            return;
        }

        const restored = await trashService.restoreItem(collection, recordId);
        res.status(200).json({
            success: true,
            message: `Successfully restored ${collection} record #${recordId}.`,
            data: restored,
        });
    } catch (err: any) {
        console.error('[TrashController] restoreItem error:', err.message);
        res.status(400).json({ success: false, message: err.message || 'Failed to restore item.' });
    }
};

/** DELETE /api/trash/:collection/:id — permanently delete an item */
export const permanentDeleteItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const collection = String(req.params.collection);
        const recordId = Number(req.params.id);

        if (!collection || !recordId || isNaN(recordId)) {
            res.status(400).json({ success: false, message: 'Valid collection and record ID required.' });
            return;
        }

        const success = await trashService.permanentlyDeleteItem(collection, recordId);
        res.status(200).json({
            success,
            message: `Permanently removed ${collection} record #${recordId} from database.`,
        });
    } catch (err: any) {
        console.error('[TrashController] permanentDeleteItem error:', err.message);
        res.status(400).json({ success: false, message: err.message || 'Failed to delete item.' });
    }
};

/** DELETE /api/trash/empty — purge all trashed records */
export const emptyTrash = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const result = await trashService.emptyAllTrash();
        res.status(200).json({
            success: true,
            message: `Trash emptied. ${result.total} records permanently purged.`,
            details: result.details,
        });
    } catch (err: any) {
        console.error('[TrashController] emptyTrash error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to empty trash.' });
    }
};
