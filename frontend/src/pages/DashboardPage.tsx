import { useEffect, useState, useCallback } from 'react';
import {
    Ship, Anchor, Truck, CheckCircle2, Play,
    AlertCircle, RefreshCw, Timer, Cpu, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, API_BASE_URL } from '../lib/api';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardPage({ role }: { role: string }) {
    const navigate = useNavigate();
    const [_, setMetrics] = useState<any>(null);
    const [operations, setOperations] = useState<any[]>([]);
    const [ships, setShips] = useState<any[]>([]);
    const [__, setCargos] = useState<any[]>([]);
    const [equipments, setEquipments] = useState<any[]>([]);
    const [osState, setOsState] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [m, ops, sh, cnts, res, os] = await Promise.all([
                api.analytics.get().catch(() => null),
                api.operations.list().catch(() => []),
                api.ships.list().catch(() => []),
                api.Cargos.list().catch(() => []),
                api.Equipments.list().catch(() => []),
                api.os.state().catch(() => null),
            ]);
            setMetrics(m);
            setOperations(ops);
            setShips(sh);
            setCargos(cnts);
            setEquipments(res);
            setOsState(os);
        } catch (e: any) {
            setError(e.message || 'Failed to load dashboard data from backend');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    // Calculate metrics
    const totalShips = ships.length;
    const activeOperations = operations.filter(o => o.status !== 'Completed').length;
    const readyJobs = operations.filter(o => o.status === 'Ready' || o.status === 'Queued').length;
    const runningJobs = operations.filter(o => o.status === 'Running').length;
    const completedJobs = operations.filter(o => o.status === 'Completed').length;
    const availableBerths = equipments.filter(r => r.type === 'Berth' && r.status === 'Available').length;
    const availableCranes = equipments.filter(r => r.type === 'Crane' && r.status === 'Available').length;
    const availableTrucks = equipments.filter(r => r.type === 'Truck' && r.status === 'Available').length;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const recentOps = operations.slice(0, 10);
    const schedulerType = osState?.schedulingAlgorithm || 'FCFS';

    const handleAlgoChange = async (algo: string) => {
        try {
            await fetch(`${API_BASE_URL}/os/algorithm`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('portflow_auth_token')}`
                },
                body: JSON.stringify({ algorithm: algo })
            });
            void load();
        } catch (err: any) {
            setError(err.message || 'Failed to change algorithm');
        }
    };

    // Operator specific metrics
    const completedOps = operations.filter(o => o.status === 'Completed' && o.turnaround_time_ms);
    const avgWait = completedOps.length ? Math.round(completedOps.reduce((a, b) => a + (b.waiting_time_ms || 0), 0) / completedOps.length / 1000) : 0;
    const avgTurnaround = completedOps.length ? Math.round(completedOps.reduce((a, b) => a + (b.turnaround_time_ms || 0), 0) / completedOps.length / 1000) : 0;

    const basePath = role === 'Admin' ? '/admin' : '/operator';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{role} PORTFLOW CONSOLE</p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Port Operations Overview</h1>
                    <p className="text-sm text-muted-foreground">
                        Real-time port telemetry, OS process queuing, and PostgreSQL relational allocations
                    </p>
                </div>
                <div className="flex flex-col sm:items-end gap-1.5">
                    <div className="text-xs text-muted-foreground font-mono">
                        {dateStr} · {timeStr}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Algorithm Switcher Banner */}
            <Card className="border bg-gradient-to-r from-card to-primary/5">
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Cpu className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="font-semibold text-sm">
                                {role === 'Admin' ? 'CPU Scheduling Algorithm Control' : 'Active Scheduling Engine'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Active algorithm: <span className="font-semibold text-foreground">{schedulerType}</span>
                                {role === 'Admin' ? ' · Dynamically switchable by Admin' : ' · Configured by Port Administrator'}
                            </div>
                        </div>
                    </div>
                    {role === 'Admin' ? (
                        <div className="flex items-center gap-1.5 rounded-md border p-1 bg-background/80">
                            {(['FCFS', 'SJF', 'PRIORITY'] as const).map((algo) => (
                                <button
                                    key={algo}
                                    type="button"
                                    onClick={() => void handleAlgoChange(algo)}
                                    className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                                        schedulerType === algo
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {algo}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-md bg-primary/10 text-primary font-mono text-xs font-bold border border-primary/20">
                                {schedulerType} ACTIVE
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tabs Layout */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                    {/* Stat Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {role === 'Admin' ? (
                            <>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Ships</CardTitle>
                                        <Ship className="h-4 w-4 text-sky-500" />
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? <Skeleton className="h-8 w-16" /> : (
                                            <div className="text-2xl font-bold font-mono">{totalShips}</div>
                                        )}
                                        <p className="text-[11px] text-muted-foreground mt-1">Registered in port waters</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Active Operations</CardTitle>
                                        <Anchor className="h-4 w-4 text-emerald-500" />
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? <Skeleton className="h-8 w-16" /> : (
                                            <div className="text-2xl font-bold font-mono">{activeOperations}</div>
                                        )}
                                        <p className="text-[11px] text-muted-foreground mt-1">Unfinished tasks in progress</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Ready / Queued</CardTitle>
                                        <Timer className="h-4 w-4 text-amber-500" />
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? <Skeleton className="h-8 w-16" /> : (
                                            <div className="text-2xl font-bold font-mono">{readyJobs}</div>
                                        )}
                                        <p className="text-[11px] text-muted-foreground mt-1">In OS ready queue</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Running Jobs</CardTitle>
                                        <Play className="h-4 w-4 text-blue-500" />
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? <Skeleton className="h-8 w-16" /> : (
                                            <div className="text-2xl font-bold font-mono">{runningJobs}</div>
                                        )}
                                        <p className="text-[11px] text-muted-foreground mt-1">Holding mutex/semaphore</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Completed Jobs</CardTitle>
                                        <CheckCircle2 className="h-4 w-4 text-purple-500" />
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? <Skeleton className="h-8 w-16" /> : (
                                            <div className="text-2xl font-bold font-mono">{completedJobs}</div>
                                        )}
                                        <p className="text-[11px] text-muted-foreground mt-1">Discharged & processed</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Available Berths</CardTitle>
                                        <Anchor className="h-4 w-4 text-cyan-500" />
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? <Skeleton className="h-8 w-16" /> : (
                                            <div className="text-2xl font-bold font-mono">{availableBerths}</div>
                                        )}
                                        <p className="text-[11px] text-muted-foreground mt-1">Open docking positions</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Available Cranes</CardTitle>
                                        <Truck className="h-4 w-4 text-orange-500" />
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? <Skeleton className="h-8 w-16" /> : (
                                            <div className="text-2xl font-bold font-mono">{availableCranes}</div>
                                        )}
                                        <p className="text-[11px] text-muted-foreground mt-1">Unlocked gantry cranes</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Available Trucks</CardTitle>
                                        <Truck className="h-4 w-4 text-emerald-500" />
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? <Skeleton className="h-8 w-16" /> : (
                                            <div className="text-2xl font-bold font-mono">{availableTrucks}</div>
                                        )}
                                        <p className="text-[11px] text-muted-foreground mt-1">Yard transport vehicles</p>
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            <>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Active Jobs</CardTitle>
                                        <Anchor className="h-4 w-4 text-emerald-500" />
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? <Skeleton className="h-8 w-16" /> : (
                                            <div className="text-2xl font-bold font-mono">{activeOperations}</div>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Running Jobs</CardTitle>
                                        <Play className="h-4 w-4 text-amber-500" />
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? <Skeleton className="h-8 w-16" /> : (
                                            <div className="text-2xl font-bold font-mono">{runningJobs}</div>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Completed Jobs</CardTitle>
                                        <CheckCircle2 className="h-4 w-4 text-purple-500" />
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? <Skeleton className="h-8 w-16" /> : (
                                            <div className="text-2xl font-bold font-mono">{completedJobs}</div>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Avg Wait Time</CardTitle>
                                        <Timer className="h-4 w-4 text-blue-500" />
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? <Skeleton className="h-8 w-16" /> : (
                                            <div className="text-2xl font-bold font-mono">{avgWait}s</div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>

                    {/* Live Operations Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Anchor className="h-4 w-4 text-primary" /> Live Port Operations Feed
                                </CardTitle>
                                <CardDescription>
                                    Real-time processes undergoing discharge, inspection, and crane handling.
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`${basePath}/operations`)}
                            >
                                View All <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full" />
                                    ))}
                                </div>
                            ) : operations.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Anchor className="mx-auto mb-2 h-8 w-8 opacity-40" />
                                    <h3 className="font-semibold text-foreground">No operations active</h3>
                                    <p className="text-xs mt-1">Schedule new port operations from the Operations page.</p>
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/40">
                                                <TableHead className="font-semibold text-xs uppercase">Ref</TableHead>
                                                <TableHead className="font-semibold text-xs uppercase">Ship Name</TableHead>
                                                <TableHead className="font-semibold text-xs uppercase">Berth / Crane</TableHead>
                                                <TableHead className="font-semibold text-xs uppercase">Status</TableHead>
                                                <TableHead className="font-semibold text-xs uppercase">Priority</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentOps.map((op: any) => (
                                                <TableRow key={op.id}>
                                                    <TableCell className="font-mono text-xs font-semibold">
                                                        OP-{op.id}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-foreground">
                                                        {op.ship_name}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {op.berth_id || 'Berth 1'} · {op.crane_id || 'Crane A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${
                                                            op.status === 'Running'
                                                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                                                                : op.status === 'Completed'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                                                        }`}>
                                                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                            {op.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        P{op.priority || 1}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Operational Telemetry & Performance</CardTitle>
                            <CardDescription>
                                Track waiting time decay, berth turnover rates, and peak hour dispatch bottlenecks.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg border bg-muted/20">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase">Average Wait Time</div>
                                    <div className="text-2xl font-bold font-mono mt-1">{avgWait}s</div>
                                    <div className="text-xs text-muted-foreground mt-1">Average queue dwell before crane acquisition</div>
                                </div>
                                <div className="p-4 rounded-lg border bg-muted/20">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase">Average Turnaround Time</div>
                                    <div className="text-2xl font-bold font-mono mt-1">{avgTurnaround}s</div>
                                    <div className="text-xs text-muted-foreground mt-1">Total process execution duration</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="reports" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Generated System Reports</CardTitle>
                            <CardDescription>
                                View exported PostgreSQL analytics, manifest compliance reports, and audit trails.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Navigate to the Reports page from the navigation bar or Command Palette to run live SQL JOIN diagnostics.
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Port Operations Preferences</CardTitle>
                            <CardDescription>
                                Configure default berth allocation rules, semaphore timeouts, and notification preferences.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-sm">
                                <div>
                                    <div className="font-medium text-foreground">Dynamic Resource Customization</div>
                                    <div className="text-xs text-muted-foreground">Allows operators to dynamically choose custom crane IDs and berths</div>
                                </div>
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                    Enabled
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
