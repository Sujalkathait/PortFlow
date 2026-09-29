import { useEffect, useState, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
    Trash2, RotateCcw, AlertCircle, CheckCircle2, RefreshCw, X, ArrowUpDown
} from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';

interface TrashRecord {
    id: number;
    _collection: string;
    label?: string;
    operation_type?: string;
    ship_name?: string;
    name?: string;
    imo_number?: string;
    Cargo_number?: string;
    cargo_type?: string;
    type?: string;
    created_at: string;
    deleted_at?: string;
    deleted_by?: string;
}

export function TrashPage() {
    const [items, setItems] = useState<TrashRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api.trash.list();
            setItems(data);
        } catch (e: any) {
            setError(e.message || 'Failed to load trash records');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handleRestore = async (collection: string, id: number) => {
        setError('');
        setSuccess('');
        try {
            await api.trash.restore(collection, id);
            setSuccess('Record restored successfully to active database.');
            void load();
        } catch (e: any) {
            setError(e.message || 'Failed to restore record');
        }
    };

    const handlePermanentDelete = async (collection: string, id: number) => {
        setError('');
        setSuccess('');
        if (!window.confirm('Permanently delete this record? This action cannot be undone.')) return;
        try {
            await api.trash.permanentDelete(collection, id);
            setSuccess('Record permanently purged from database.');
            void load();
        } catch (e: any) {
            setError(e.message || 'Failed to delete record permanently');
        }
    };

    const handleEmptyTrash = async () => {
        setError('');
        setSuccess('');
        if (!window.confirm(`Permanently purge all ${items.length} records in trash? This cannot be undone.`)) return;
        try {
            const result = await api.trash.emptyAll();
            setSuccess(result.message || 'Trash purged successfully');
            void load();
        } catch (e: any) {
            setError(e.message || 'Failed to empty trash');
        }
    };

    const getRecordLabel = (item: TrashRecord) => {
        switch (item._collection) {
            case 'operations':
                return `OP-${item.id} — ${item.label || item.operation_type} (${item.ship_name || 'Vessel'})`;
            case 'ships':
                return `Ship: ${item.label || item.name} (${item.ship_name || item.imo_number || 'Vessel'})`;
            case 'Cargos':
                return `Cargo: ${item.label || item.Cargo_number} (${item.ship_name || item.cargo_type || 'Container'})`;
            case 'Equipments':
                return `Equipment: ${item.label || item.name} (${item.type || 'Infrastructure'})`;
            default:
                return `Record #${item.id}`;
        }
    };

    const columns: ColumnDef<TrashRecord>[] = useMemo(() => [
        {
            accessorKey: 'label',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 text-xs font-semibold"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Record Information
                    <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
            ),
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div>
                        <div className="font-semibold text-foreground">{getRecordLabel(item)}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            Created: {new Date(item.created_at).toLocaleString()}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: '_collection',
            header: 'Entity Type',
            cell: ({ row }) => {
                const col = row.original._collection;
                const badges: Record<string, string> = {
                    operations: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                    ships: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
                    Cargos: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                    Equipments: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
                };
                return (
                    <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded uppercase border ${badges[col] || 'bg-muted text-muted-foreground'}`}>
                        {col}
                    </span>
                );
            },
        },
        {
            accessorKey: 'deleted_at',
            header: 'Deleted At',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.deleted_at ? new Date(row.original.deleted_at).toLocaleString() : '—'}
                </span>
            ),
        },
        {
            accessorKey: 'deleted_by',
            header: 'Deleted By',
            cell: ({ row }) => (
                <span className="text-xs font-medium text-foreground">
                    {row.original.deleted_by || 'System'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center justify-end gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => void handleRestore(item._collection, item.id)}
                        >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restore
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => void handlePermanentDelete(item._collection, item.id)}
                        >
                            <X className="h-3.5 w-3.5 mr-1" /> Purge
                        </Button>
                    </div>
                );
            },
        },
    ], []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Data Recovery & Audit</p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Trash & Recycle Bin</h1>
                    <p className="text-sm text-muted-foreground">Audit, recover, or permanently purge soft-deleted records from PostgreSQL</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    {items.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={() => void handleEmptyTrash()}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Purge All ({items.length})
                        </Button>
                    )}
                </div>
            </div>

            {/* Notification Alerts */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            {/* TanStack Table Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4 text-primary" /> Deleted Database Records
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                            {items.length} items staged in trash
                        </span>
                    </CardTitle>
                    <CardDescription>
                        Items retained here can be restored instantly with full relational integrity.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={items}
                        searchKey="_collection"
                        searchPlaceholder="Filter by entity type (operations, ships...)"
                        loading={loading}
                        emptyMessage="The trash bin is completely empty. No deleted records found."
                    />
                </CardContent>
            </Card>
        </div>
    );
}
