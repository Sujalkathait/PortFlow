import { useEffect, useState, useCallback } from 'react';
import { ScrollText, ShieldCheck, RefreshCw, AlertCircle, Clock, Activity, User } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export function LogsPage() {
    const [systemLogs, setSystemLogs] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('portflow_auth_token');
            const headers = {
                'Authorization': `Bearer ${token}`
            };
            const [sysRes, auditRes] = await Promise.all([
                fetch(`${API_BASE_URL}/system/logs`, { headers }),
                fetch(`${API_BASE_URL}/system/audit`, { headers })
            ]);
            
            if (!sysRes.ok || !auditRes.ok) throw new Error('Failed to fetch logs');
            
            const sys = await sysRes.json();
            const audit = await auditRes.json();
            
            setSystemLogs(sys);
            setAuditLogs(audit);
        } catch (e: any) {
            setError(e.message || 'Failed to load logs');
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
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">System & Audit Logs</h1>
                    <p className="text-sm text-muted-foreground">Monitor real-time system events, application errors, and user mutation audits</p>
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

            {/* Log Tabs */}
            <Tabs defaultValue="system" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="system" className="flex items-center gap-2">
                        <ScrollText className="h-4 w-4" /> System Logs ({systemLogs.length})
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> User Audits ({auditLogs.length})
                    </TabsTrigger>
                </TabsList>

                {/* System Logs Tab */}
                <TabsContent value="system" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Activity className="h-4 w-4 text-primary" /> Application Runtime Events
                            </CardTitle>
                            <CardDescription>
                                Low-level server operations, daemon tasks, and background warnings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-14 w-full" />
                                    ))}
                                </div>
                            ) : systemLogs.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8 italic">No system logs recorded.</p>
                            ) : (
                                <div className="divide-y">
                                    {systemLogs.map((log) => (
                                        <div key={log.id} className="py-3 flex flex-col gap-1 first:pt-0 last:pb-0">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                    log.level === 'WARN'
                                                        ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400'
                                                        : log.level === 'ERROR'
                                                        ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-400'
                                                        : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400'
                                                }`}>
                                                    {log.level}
                                                </span>
                                            </div>
                                            <div className="text-sm">
                                                <span className="font-semibold text-foreground mr-1.5">[{log.source}]:</span>
                                                <span className="text-muted-foreground">{log.message}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Audit Logs Tab */}
                <TabsContent value="audit" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" /> User Actions & Mutation Audit
                            </CardTitle>
                            <CardDescription>
                                Tamper-evident trail of who performed administrative and operator tasks.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-14 w-full" />
                                    ))}
                                </div>
                            ) : auditLogs.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8 italic">No audit records found.</p>
                            ) : (
                                <div className="divide-y">
                                    {auditLogs.map((log) => (
                                        <div key={log.id} className="py-3 flex flex-col gap-1 first:pt-0 last:pb-0">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1 font-medium text-foreground">
                                                    <User className="h-3 w-3 text-muted-foreground" />
                                                    {log.user}
                                                </span>
                                                <span>{new Date(log.timestamp).toLocaleString()}</span>
                                            </div>
                                            <div className="text-sm">
                                                <span className="font-semibold text-primary mr-1.5">{log.action}:</span>
                                                <span className="text-muted-foreground">{log.details}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
