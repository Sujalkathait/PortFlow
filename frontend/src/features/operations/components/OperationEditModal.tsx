import { Sliders, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OperationRecord } from '../types/operation.types';

interface OperationEditModalProps {
    operation: OperationRecord | null;
    onClose: () => void;
    onUpdateStatus: (id: number, status: string) => void;
}

export function OperationEditModal({
    operation,
    onClose,
    onUpdateStatus,
}: OperationEditModalProps) {
    if (!operation) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-xl border bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-4 border-b">
                    <div className="flex items-center gap-2">
                        <Sliders className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Update OP-{operation.id}</h3>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Change Status</label>
                        <select
                            value={operation.status}
                            onChange={e => {
                                onUpdateStatus(operation.id, e.target.value);
                                onClose();
                            }}
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            <option value="Queued">Queued (In Ready Queue)</option>
                            <option value="Running">Running (Acquired Locks)</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-end pt-4 border-t">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
