import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Play, CheckCircle2, Sliders, Trash2,
    Anchor, ArrowUpDown, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import type { OperationRecord } from '../types/operation.types';

interface OperationsTableProps {
    operations: OperationRecord[];
    loading: boolean;
    onUpdateStatus: (id: number, status: string) => void;
    onEdit: (op: OperationRecord) => void;
    onDelete: (id: number) => void;
    isAdmin?: boolean;
}

export function OperationsTable({
    operations,
    loading,
    onUpdateStatus,
    onEdit,
    onDelete,
    isAdmin = true,
}: OperationsTableProps) {
    const columns: ColumnDef<OperationRecord>[] = useMemo(() => [
        {
            accessorKey: 'id',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 text-xs font-semibold"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Ref
                    <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground border">
                    OP-{row.original.id}
                </span>
            ),
        },
        {
            accessorKey: 'operation_type',
            header: 'Type',
            cell: ({ row }) => (
                <span className="font-medium text-foreground">{row.original.operation_type}</span>
            ),
        },
        {
            accessorKey: 'ship_name',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 text-xs font-semibold"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Ship
                    <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 font-medium">
                    <Anchor className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{row.original.ship_name}</span>
                </div>
            ),
        },
        {
            id: 'resources',
            header: 'Berth / Crane',
            cell: ({ row }) => (
                <div className="inline-flex items-center gap-1.5 text-xs bg-muted/60 px-2 py-1 rounded border">
                    <span className="font-semibold text-foreground">{row.original.berth_id}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{row.original.crane_id}</span>
                </div>
            ),
        },
        {
            accessorKey: 'priority',
            header: 'Priority',
            cell: ({ row }) => {
                const p = row.original.priority;
                if (p >= 3) {
                    return <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 px-2.5 py-0.5 text-xs font-medium border border-red-200 dark:border-red-800">Critical</span>;
                }
                if (p === 2) {
                    return <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 px-2.5 py-0.5 text-xs font-medium border border-amber-200 dark:border-amber-800">High</span>;
                }
                return <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-0.5 text-xs font-medium border border-slate-200 dark:border-slate-700">Normal</span>;
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const s = row.original.status;
                const statusStyles: Record<string, string> = {
                    Queued: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
                    Running: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800 animate-pulse',
                    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
                    Cancelled: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
                };
                return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusStyles[s] || statusStyles.Queued}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {s}
                    </span>
                );
            },
        },
        {
            accessorKey: 'timing',
            header: 'Timing',
            cell: ({ row }) => {
                const op = row.original;
                return (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                            {op.turnaround_time_ms
                                ? `${(op.turnaround_time_ms / 1000).toFixed(1)}s`
                                : op.start_time
                                ? 'Executing'
                                : 'Queued'}
                        </span>
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const op = row.original;
                return (
                    <div className="flex items-center justify-end gap-1">
                        {op.status === 'Queued' && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => onUpdateStatus(op.id, 'Running')}
                                title="Run Operation"
                            >
                                <Play className="h-3 w-3 mr-1" /> Run
                            </Button>
                        )}
                        {op.status === 'Running' && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => onUpdateStatus(op.id, 'Completed')}
                                title="Mark Completed"
                            >
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => onEdit(op)}
                            title="Edit"
                        >
                            <Sliders className="h-3.5 w-3.5" />
                        </Button>
                        {isAdmin && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => onDelete(op.id)}
                                title="Move to Trash"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ], [onUpdateStatus, onEdit, onDelete, isAdmin]);

    return (
        <DataTable
            columns={columns}
            data={operations}
            searchKey="ship_name"
            searchPlaceholder="Filter operations by ship..."
            loading={loading}
            emptyMessage="No operations found. Click '+ New Operation' to create one."
        />
    );
}
