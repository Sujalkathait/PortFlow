import { useEffect, useState, type FormEvent, useCallback, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Trash2, X, Ship, AlertCircle, CheckCircle2, RefreshCw, ArrowUpDown } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';

interface ShipRecord {
    id: number;
    name: string;
    imo_number?: string;
    vessel_type: string;
    capacity_teu: number;
    berth_id?: string | null;
    status: string;
    created_at?: string;
}

export function ShipsPage() {
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'Admin';

    const [ships, setShips] = useState<ShipRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form inputs
    const [name, setName] = useState('');
    const [imo, setImo] = useState('');
    const [vesselType, setVesselType] = useState('Cargo');
    const [capacity, setCapacity] = useState('');
    const [berthOption, setBerthOption] = useState('');
    const [customBerth, setCustomBerth] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api.ships.list();
            setShips(data);
        } catch (e: any) {
            setError(e.message || 'Failed to load ships');
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
            setError('Ship name is required');
            setSubmitting(false);
            return;
        }

        const chosenBerth = berthOption === 'Custom' ? customBerth.trim() : berthOption;

        try {
            await api.ships.create({
                name: name.trim(),
                imo_number: imo.trim() || undefined,
                vessel_type: vesselType,
                capacity_teu: Number(capacity) || 0,
                berth_id: chosenBerth || null,
            });
            setSuccess('Ship registered successfully in database');
            setShowCreate(false);
            setName('');
            setImo('');
            setCapacity('');
            setBerthOption('');
            setCustomBerth('');
            void load();
        } catch (e: any) {
            setError(e.message || 'Failed to register ship');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            await api.ships.update(id, { status });
            setSuccess(`Ship status updated to ${status}`);
            void load();
        } catch (e: any) {
            setError(e.message || 'Failed to update ship status');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Move this ship to Trash?')) return;
        try {
            await api.ships.delete(id);
            setSuccess('Ship moved to Trash Bin');
            void load();
        } catch (e: any) {
            setError(e.message || 'Failed to delete ship');
        }
    };

    const columns: ColumnDef<ShipRecord>[] = useMemo(() => [
        {
            accessorKey: 'id',
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
                    S-{row.original.id}
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
                    Vessel Name
                    <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Ship className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <div className="font-semibold text-foreground">{row.original.name}</div>
                        {row.original.imo_number && (
                            <div className="font-mono text-[11px] text-muted-foreground">{row.original.imo_number}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'vessel_type',
            header: 'Type',
            cell: ({ row }) => (
                <span className="text-sm font-medium">{row.original.vessel_type}</span>
            ),
        },
        {
            accessorKey: 'capacity_teu',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 text-xs font-semibold"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Capacity (TEU)
                    <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="font-mono text-sm">
                    {row.original.capacity_teu > 0 ? row.original.capacity_teu.toLocaleString() : '—'}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const s = row.original;
                return (
                    <select
                        value={s.status}
                        onChange={e => void handleUpdateStatus(s.id, e.target.value)}
                        className={`text-xs font-medium rounded-full px-2.5 py-1 border transition-colors cursor-pointer ${
                            s.status === 'Docked'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                : s.status === 'Arriving'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                    >
                        <option value="Docked">Docked</option>
                        <option value="Arriving">Arriving</option>
                        <option value="Departed">Departed</option>
                    </select>
                );
            },
        },
        {
            accessorKey: 'berth_id',
            header: 'Berth',
            cell: ({ row }) => (
                <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                    {row.original.berth_id || 'Unassigned'}
                </span>
            ),
        },
        ...(isAdmin ? [{
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }: { row: any }) => (
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
        }] : []),
    ], [isAdmin]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Vessel Management</p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {isAdmin ? 'Ships Registry & Management' : 'Assigned Vessels & Status'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {isAdmin ? 'Register, track berthing locations, and manage vessels in port' : 'Monitor vessel schedules and update operational berthing status'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    {isAdmin && (
                        <Button size="sm" onClick={() => setShowCreate(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Register Ship
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
                            <Ship className="h-4 w-4 text-primary" /> Registered Vessels
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                            {ships.length} vessels in registry
                        </span>
                    </CardTitle>
                    <CardDescription>
                        Filter vessels by name or IMO code, sort columns, and update docking status in real-time.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={ships}
                        searchKey="name"
                        searchPlaceholder="Filter vessels by name..."
                        loading={loading}
                        emptyMessage="No vessels registered in the port database. Click 'Register Ship' to add one."
                    />
                </CardContent>
            </Card>

            {/* REGISTER SHIP MODAL */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg rounded-xl border bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b">
                            <div className="flex items-center gap-2">
                                <Ship className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-lg">Register New Vessel</h3>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCreate(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Ship Name *</label>
                                <Input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. MV Ocean Star"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">IMO Number</label>
                                <Input
                                    value={imo}
                                    onChange={e => setImo(e.target.value)}
                                    placeholder="e.g. IMO-9876543"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Vessel Type</label>
                                    <select
                                        value={vesselType}
                                        onChange={e => setVesselType(e.target.value)}
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option>Cargo</option>
                                        <option>Bulk Carrier</option>
                                        <option>Tanker</option>
                                        <option>General Cargo</option>
                                        <option>Ro-Ro</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Capacity (TEU)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={capacity}
                                        onChange={e => setCapacity(e.target.value)}
                                        placeholder="e.g. 5000"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Berth Selection (apne according) */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Assign Berth (Dynamic)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={berthOption}
                                        onChange={e => setBerthOption(e.target.value)}
                                        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="">Not assigned</option>
                                        <option value="Berth 1">Berth 1</option>
                                        <option value="Berth 2">Berth 2</option>
                                        <option value="Berth 3">Berth 3</option>
                                        <option value="Berth 4">Berth 4</option>
                                        <option value="Custom">Custom Berth...</option>
                                    </select>
                                    {berthOption === 'Custom' ? (
                                        <Input
                                            value={customBerth}
                                            onChange={e => setCustomBerth(e.target.value)}
                                            placeholder="Enter Berth name/ID"
                                            required
                                        />
                                    ) : (
                                        <div className="text-xs text-muted-foreground flex items-center px-2 bg-muted/40 rounded border">
                                            {berthOption ? `Assigned: ${berthOption}` : 'No berth selected'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? 'Registering...' : 'Register Ship'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
