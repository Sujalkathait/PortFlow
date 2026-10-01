import { useEffect, useState, type FormEvent, useCallback, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Trash2, X, Boxes, AlertCircle, CheckCircle2, RefreshCw, ArrowUpDown, Box } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';

interface CargoRecord {
    id: number;
    cargo_number: string;
    size_type: string;
    weight_tons: number;
    cargo_type: string;
    ship_name?: string | null;
    current_location: string;
    status: string;
    created_at?: string;
}

export function CargoPage() {
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'Admin';

    const [cargos, setCargos] = useState<CargoRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form inputs
    const [number, setNumber] = useState('');
    const [sizeType, setSizeType] = useState('20ft');
    const [weight, setWeight] = useState('');
    const [cargoType, setCargoType] = useState('');
    const [location, setLocation] = useState('');
    const [shipName, setShipName] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api.Cargos.list();
            setCargos(data);
        } catch (e: any) {
            setError(e.message || 'Failed to load cargo records');
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

        if (!number.trim()) {
            setError('Cargo identifier number is required');
            setSubmitting(false);
            return;
        }

        try {
            await api.Cargos.create({
                cargo_number: number.trim(),
                size_type: sizeType,
                weight_tons: Number(weight) || 0,
                cargo_type: cargoType.trim() || 'General',
                current_location: location.trim() || 'Yard',
                ship_name: shipName.trim(),
            });
            setSuccess('Cargo registered successfully in database');
            setShowCreate(false);
            setNumber('');
            setWeight('');
            setCargoType('');
            setLocation('');
            setShipName('');
            void load();
        } catch (e: any) {
            setError(e.message || 'Failed to create cargo record');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            await api.Cargos.update(id, { status });
            setSuccess(`Cargo status updated to ${status}`);
            void load();
        } catch (e: any) {
            setError(e.message || 'Failed to update cargo status');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Move this cargo to Trash?')) return;
        try {
            await api.Cargos.delete(id);
            setSuccess('Cargo moved to Trash Bin');
            void load();
        } catch (e: any) {
            setError(e.message || 'Failed to delete cargo');
        }
    };

    const columns: ColumnDef<CargoRecord>[] = useMemo(() => [
        {
            accessorKey: 'cargo_number',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 text-xs font-semibold"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Cargo Number
                    <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground border">
                        {row.original.cargo_number}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'size_type',
            header: 'Size',
            cell: ({ row }) => (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted/60 border text-muted-foreground">
                    {row.original.size_type}
                </span>
            ),
        },
        {
            accessorKey: 'weight_tons',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 text-xs font-semibold"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Weight (t)
                    <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="font-mono text-sm">
                    {row.original.weight_tons > 0 ? `${row.original.weight_tons}t` : '—'}
                </span>
            ),
        },
        {
            accessorKey: 'cargo_type',
            header: 'Contents',
            cell: ({ row }) => (
                <span className="text-sm font-medium">{row.original.cargo_type}</span>
            ),
        },
        {
            accessorKey: 'ship_name',
            header: 'Ship',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.ship_name || '—'}
                </span>
            ),
        },
        {
            accessorKey: 'current_location',
            header: 'Location',
            cell: ({ row }) => (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted text-foreground">
                    {row.original.current_location}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const c = row.original;
                return (
                    <select
                        value={c.status}
                        onChange={e => void handleUpdateStatus(c.id, e.target.value)}
                        className={`text-xs font-medium rounded-full px-2.5 py-1 border transition-colors cursor-pointer ${
                            c.status === 'Cleared'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                : c.status === 'On Ship'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                                : c.status === 'In Yard'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800'
                                : 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800'
                        }`}
                    >
                        <option value="On Ship">On Ship</option>
                        <option value="In Yard">In Yard</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Cleared">Cleared</option>
                    </select>
                );
            },
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
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Cargo & Container Tracking</p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {isAdmin ? 'Cargo Inventory & Management' : 'Cargo Movement & Handling'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {isAdmin ? 'Track containers, manifest status, yard locations, and customs clearance' : 'Handle container movement and update yard tracking status'}
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
                            Add Cargo
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
                            <Boxes className="h-4 w-4 text-primary" /> Registered Containers & Cargo
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                            {cargos.length} items recorded
                        </span>
                    </CardTitle>
                    <CardDescription>
                        Filter by container identifier, verify manifests, and adjust transfer states.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={cargos}
                        searchKey="cargo_number"
                        searchPlaceholder="Filter by Cargo number..."
                        loading={loading}
                        emptyMessage={
                            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                <Boxes className="h-12 w-12 opacity-20 mb-4" />
                                <h3 className="font-semibold text-lg text-foreground">No cargo found</h3>
                                <p className="text-sm max-w-sm mt-1">There are no containers in the database. Click "Add Cargo" to register one.</p>
                            </div>
                        }
                    />
                </CardContent>
            </Card>

            {/* ADD CARGO MODAL */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg rounded-xl border bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b">
                            <div className="flex items-center gap-2">
                                <Boxes className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-lg">Add New Cargo</h3>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCreate(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Cargo Number *</label>
                                <Input
                                    value={number}
                                    onChange={e => setNumber(e.target.value)}
                                    placeholder="e.g. MSKU-4821376"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Size Type</label>
                                    <select
                                        value={sizeType}
                                        onChange={e => setSizeType(e.target.value)}
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option>20ft</option>
                                        <option>40ft</option>
                                        <option>40ft HC</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Weight (tons)</label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={weight}
                                        onChange={e => setWeight(e.target.value)}
                                        placeholder="e.g. 24.5"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Cargo Type</label>
                                    <Input
                                        value={cargoType}
                                        onChange={e => setCargoType(e.target.value)}
                                        placeholder="e.g. Electronics, Perishables"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Ship Name</label>
                                    <Input
                                        value={shipName}
                                        onChange={e => setShipName(e.target.value)}
                                        placeholder="e.g. MV Ocean Star"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Current Location</label>
                                <Input
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    placeholder="e.g. Yard A-12, Wharf Quay 3"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Add Cargo'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
