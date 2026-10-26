import { useEffect, useState, useCallback } from 'react';
import { Database, RefreshCw, AlertCircle, Zap, Network, Play, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ReportsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // GraphQL interactive test state
    const [gqlLoading, setGqlLoading] = useState(false);
    const [gqlResult, setGqlResult] = useState<any>(null);
    const [gqlTime, setGqlTime] = useState<number | null>(null);
    const [gqlError, setGqlError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api.system.reports();
            setStats(data);
        } catch (e: any) {
            setError(e.message || 'Failed to load reports');
        } finally {
            setLoading(false);
        }
    }, []);

    const executeSampleGraphQL = async () => {
        setGqlLoading(true);
        setGqlError('');
        const start = performance.now();
        const sampleQuery = `
query GetPortOverview {
  portDashboardOverview {
    tableStats {
      ships
      cargo
      operations
      equipment
      warehouses
      trucks
      bills
      issues
    }
    activeOperationsCount
    dockedShipsCount
    resourceAvailabilityPercent
    dbStatus
  }
}
        `.trim();

        try {
            const data = await api.graphql.query<any>(sampleQuery);
            setGqlTime(Math.round(performance.now() - start));
            setGqlResult(data);
        } catch (err: any) {
            setGqlError(err.message || 'GraphQL query failed');
        } finally {
            setGqlLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, [load]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Operational Reporting & Telemetry
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Operational Activity & Architecture Report
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Dual REST and GraphQL API monitoring, table counts, and relational JOIN benchmarks
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Telemetry
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
                                    <Database className="h-4 w-4 text-primary" /> Database Engine ({stats.version || 'PostgreSQL 15 (3NF Normalized)'})
                                </CardTitle>
                                <CardDescription>Connected to live relational PostgreSQL with dual REST and GraphQL endpoints</CardDescription>
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
                                <p className="text-xs text-muted-foreground mt-1">Terminal operators & users</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Operations (PCBs)</CardTitle>
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
                                <p className="text-xs text-muted-foreground mt-1">Registered calling vessels</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Cargo Manifests</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-mono">{stats.tableStats?.Cargos ?? stats.tableStats?.cargo ?? 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Containers tracked</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Dual Architecture Protocol Banner */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-blue-600" /> REST API Service Layer (`/api/*`)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-blue-950/80 dark:text-blue-300/80 space-y-1.5 leading-relaxed">
                                <p><strong>Appropriate For:</strong> Fast transactional mutations, user authentication, 30s OTP passwords, rate-limiting, and OS simulator commands (CPU dispatch, algorithm toggles).</p>
                                <p className="font-mono text-[11px] text-blue-700 dark:text-blue-400">Endpoints: POST /api/auth/login, POST /api/operations/dispatch, PUT /api/os/algorithm</p>
                            </CardContent>
                        </Card>

                        <Card className="border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                                    <Network className="h-4 w-4 text-purple-600" /> GraphQL API Graph Engine (`/graphql`)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-purple-950/80 dark:text-purple-300/80 space-y-1.5 leading-relaxed">
                                <p><strong>Appropriate For:</strong> Nested relational graph queries, composite dashboard overview, eliminating N+1 waterfall requests, and querying Vessels &rarr; Berths &rarr; Cargo manifests in a single call.</p>
                                <p className="font-mono text-[11px] text-purple-700 dark:text-purple-400">Endpoint: POST /graphql (Query, Mutation, Apollo Server)</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Live GraphQL Relational Query Playground */}
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Network className="h-4 w-4 text-purple-600" /> Live GraphQL API Client Execution
                                </CardTitle>
                                <CardDescription>
                                    Execute a live GraphQL query against the <code>/graphql</code> Apollo endpoint in real-time.
                                </CardDescription>
                            </div>
                            <Button size="sm" onClick={() => void executeSampleGraphQL()} disabled={gqlLoading}>
                                <Play className={`mr-2 h-3.5 w-3.5 ${gqlLoading ? 'animate-spin' : ''}`} />
                                {gqlLoading ? 'Executing...' : 'Run Query'}
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="font-mono text-xs bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto border border-slate-800">
                                <span className="text-purple-400">query</span> GetPortOverview &#123;<br />
                                &nbsp;&nbsp;portDashboardOverview &#123;<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;tableStats &#123; ships cargo operations equipment warehouses trucks bills issues &#125;<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;activeOperationsCount<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;dockedShipsCount<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;resourceAvailabilityPercent<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;dbStatus<br />
                                &nbsp;&nbsp;&#125;<br />
                                &#125;
                            </div>

                            {gqlError && (
                                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span>{gqlError}</span>
                                </div>
                            )}

                            {gqlResult && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> GraphQL Execution Succeeded
                                        </span>
                                        <span className="font-mono">{gqlTime}ms roundtrip</span>
                                    </div>
                                    <pre className="font-mono text-xs bg-muted/40 p-3 rounded border overflow-x-auto max-h-48 text-foreground">
                                        {JSON.stringify(gqlResult, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Relational JOIN Benchmarks */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" /> Relational SQL JOIN Performance
                            </CardTitle>
                            <CardDescription>
                                Performance telemetry from PostgreSQL foreign key JOIN queries executed across operational tables.
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
