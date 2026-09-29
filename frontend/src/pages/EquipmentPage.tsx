import { useEffect, useState, type FormEvent, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Trash2, X, Truck, Anchor, AlertCircle, CheckCircle2, RefreshCw, Warehouse, ArrowUpDown } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';

interface EquipmentRecord {
    id: number;
    Equipment_id?: string;
    name: string;
    type: string;
    status: string;
    assigned_to?: string | null;
    created_at?: string;
}

export function EquipmentPage() {
    const [equipments, setEquipments] = useState<EquipmentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [name, setName] = useState('');
    const [type, setType] = useState<string>('Berth');
    const [equipmentId, setEquipmentId] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api.Equipments.list();
            setEquipments(data);
        } catch (e: any) {
            setError(e.message || 'Failed to load equipments');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setError('');
        setSuccess('');

        if (!name.trim()) {
            setError('Equipment name is required');
            setSubmitting(false);
            return;
        }

        try {
            await api.Equipments.create({
                name: name.trim(),
                type,
                Equipment_id: equipmentId.trim() || undefined,
            });
            setSuccess('Equipment added successfully to database');
            setShowCreate(false);
            setName('');
            setEquipmentId('');
            void load();
        } catch (e: any) {
            setError(e.message || 'Failed to add equipment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            await api.Equipments.update(id, { status });
            setSuccess(`Equipment status updated to ${status}`);
            void load();
        } catch (e: any) {
            setError(e.message || 'Failed to update equipment');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Move this equipment to Trash?')) return;
        try {
            await api.Equipments.delete(id);
            setSuccess('Equipment moved to Trash Bin');
            void load();
        } catch (e: any) {
            setError(e.message || 'Failed to delete equipment');
        }
    };

    const typeIcon = (t: string) => {
        if (t === 'Berth') return <Anchor className="h-4 w-4 text-sky-500" />;
        if (t === 'Crane') return <Truck className="h-4 w-4 text-amber-500" />;
        if (t === 'Warehouse') return <Warehouse className="h-4 w-4 text-emerald-500" />;
        return <Truck className="h-4 w-4 text-muted-foreground" />;
    };

    const columns: ColumnDef<EquipmentRecord>[] = useMemo(() => [
        {
            accessorKey: 'Equipment_id',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 text-xs font-semibold"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    ID
                    <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground border">
                    {row.original.Equipment_id || `EQ-${row.original.id}`}
                </span>
            ),
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 text-xs font-semibold"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Equipment Name
                    <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {typeIcon(row.original.type)}
                    <span className="font-semibold text-foreground">{row.original.name}</span>
                </div>
            ),
        },
        {
            accessorKey: 'type',
            header: 'Type',
            cell: ({ row }) => (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted border">
                    {row.original.type}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const r = row.original;
                return (
                    <select
                        value={r.status}
                        onChange={e => void handleUpdateStatus(r.id, e.target.value)}
                        className={`text-xs font-medium rounded-full px-2.5 py-1 border transition-colors cursor-pointer ${
                            r.status === 'Available'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                : r.status === 'Occupied'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                                : r.status === 'Maintenance'
                                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
                                : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                        }`}
                    >
                        <option value="Available">Available</option>
                        <option value="Occupied">Occupied</option>
                        <option value="Running">Running</option>
                        <option value="Busy">Busy</option>
                        <option value="Maintenance">Maintenance</option>
                    </select>
                );
            },
        },
        {
            accessorKey: 'assigned_to',
            header: 'Assigned Vessel / Op',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.assigned_to || 'None'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => void handleDelete(row.original.id)}
                        title="Move to Trash"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ], []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Port Infrastructure</p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Equipment & Infrastructure</h1>
                    <p className="text-sm text-muted-foreground">Manage port berths, heavy cranes, transport trucks, and container yards</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button size="sm" onClick={() => setShowCreate(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Equipment
                    </Button>
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
                            <Truck className="h-4 w-4 text-primary" /> Registered Equipments
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                            {equipments.length} total units
                        </span>
                    </CardTitle>
                    <CardDescription>
                        Monitor real-time equipment status, active allocations, and maintenance cycles.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={equipments}
                        searchKey="name"
                        searchPlaceholder="Filter equipment by name..."
                        loading={loading}
                        emptyMessage="No equipment registered. Click 'Add Equipment' to create berths or cranes."
                    />
                </CardContent>
            </Card>

            {/* ADD EQUIPMENT MODAL */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md rounded-xl border bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b">
                            <div className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-lg">Add Port Equipment</h3>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCreate(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Equipment Name *</label>
                                <Input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Quay Crane 03, Gantry 01"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Equipment Type</label>
                                <select
                                    value={type}
                                    onChange={e => setType(e.target.value)}
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    <option value="Berth">Berth</option>
                                    <option value="Crane">Crane</option>
                                    <option value="Truck">Truck</option>
                                    <option value="Warehouse">Warehouse</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Custom Resource ID (Optional)</label>
                                <Input
                                    value={equipmentId}
                                    onChange={e => setEquipmentId(e.target.value)}
                                    placeholder="e.g. QC-03, BRTH-02"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? 'Adding...' : 'Add Equipment'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
