import { useEffect, useState, useCallback } from 'react';
import { Database, RefreshCw, AlertCircle, Server, Table as TableIcon, Zap, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ReportsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('portflow_auth_token');
            const res = await fetch(`${API_BASE_URL}/system/reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch reports');
            const data = await res.json();
            setStats(data);
        } catch (e: any) {
            setError(e.message || 'Failed to load reports');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Administration</p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Database Analytics & Diagnostics</h1>
                    <p className="text-sm text-muted-foreground">PostgreSQL telemetry, row cardinality, and live relational JOIN benchmark latency</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Notification Alert */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                        ))}
                    </div>
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : stats ? (
                <div className="space-y-6">
                    {/* Database Health Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Database className="h-4 w-4 text-primary" /> PostgreSQL Engine ({stats.version || 'v15'})
                                </CardTitle>
                                <CardDescription>Connected to live production relational database</CardDescription>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                {stats.dbStatus || 'Connected'}
                            </span>
                        </CardHeader>
                    </Card>

                    {/* Table Statistics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Users Table</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-mono">{stats.tableStats?.users ?? 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Registered operators & admins</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Operations Table</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-mono">{stats.tableStats?.operations ?? 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Logged operational processes</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Ships Table</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-mono">{stats.tableStats?.ships ?? 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Registered port vessels</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Cargos Table</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-mono">{stats.tableStats?.Cargos ?? 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Container manifests</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* JOIN Query Benchmarks */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" /> Relational JOIN Queries & Latency Benchmarks
                            </CardTitle>
                            <CardDescription>
                                Performance telemetry from foreign key JOINs executed across operational tables.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {stats.joinResults?.map((j: any, idx: number) => (
                                <div key={idx} className="rounded-lg border bg-muted/30 p-3.5 space-y-2">
                                    <div className="font-mono text-xs bg-background/80 p-2 rounded border text-foreground overflow-x-auto">
                                        <code>{j.query}</code>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                            <Zap className="h-3 w-3" /> {j.timeMs}ms latency
                                        </span>
                                        <span>·</span>
                                        <span>{j.rows} matching rows returned</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            ) : null}
        </div>
    );
}
