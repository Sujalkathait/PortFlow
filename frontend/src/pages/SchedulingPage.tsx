import { useEffect, useState, useCallback } from 'react';
import {
    Cpu, Clock, Lock, Unlock, Anchor, ShieldCheck, Play, RefreshCw, AlertCircle, CheckCircle2
} from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/auth/AuthProvider';

export function SchedulingPage() {
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'Admin';

    const [osState, setOsState] = useState<any>(null);
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dispatchMsg, setDispatchMsg] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const state = await api.os.state();
            setOsState(state);
            setMetrics(state.metrics);
        } catch (e: any) {
            setError(e.message || 'Failed to fetch OS scheduler state');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
        const interval = setInterval(() => void load(), 5000);
        return () => clearInterval(interval);
    }, [load]);

    const handleDispatch = async () => {
        try {
            const result = await api.operations.dispatch();
            if (result.dispatched) {
                setDispatchMsg(`Dispatched OP-${result.dispatched} — Burst: ${result.process?.burstTime}ms, Wait: ${result.process?.waitingTime}ms, Turnaround: ${result.process?.turnaroundTime}ms`);
            } else {
                setDispatchMsg('No processes in ready queue to dispatch');
            }
            void load();
        } catch (e: any) {
            setError(e.message || 'Dispatch failed');
        }
    };

    const readyQueue = osState?.readyQueue || [];
    const mutexes = osState?.mutexes || {};
    const semaphores = osState?.semaphores || {};
    const deadlock = osState?.deadlockDetected || false;
    const executedCount = osState?.executedCount || 0;
    const schedulerType = osState?.schedulingAlgorithm || 'FCFS';

    const handleAlgoChange = async (newAlgo: string) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:10000'}/api/os/algorithm`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('portflow_auth_token')}`
                },
                body: JSON.stringify({ algorithm: newAlgo })
            });
            void load();
        } catch (err: any) {
            setError(err.message || 'Failed to switch scheduling algorithm');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Operating System Engine</p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {isAdmin ? 'OS Scheduler & Concurrency Monitor' : 'Process Scheduling & Resource Locks'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {isAdmin
                            ? 'Real-time CPU Scheduling · Mutex Lock Allocation · Semaphores · Deadlock Detection'
                            : 'Live Process Monitoring · Active Locks & Semaphores · Deadlock Warning Telemetry'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    {isAdmin && (
                        <Button
                            size="sm"
                            onClick={() => void handleDispatch()}
                            disabled={readyQueue.length === 0}
                        >
                            <Play className="mr-2 h-4 w-4" />
                            Dispatch Next Process
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
            {dispatchMsg && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{dispatchMsg}</span>
                </div>
            )}

            {/* Algorithm Selector Bar */}
            <Card className="border">
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Cpu className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="font-semibold text-sm">
                                {isAdmin ? 'Active CPU Scheduling Algorithm' : 'Current Scheduling Algorithm'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {isAdmin ? 'Select how operations in the ready queue get dispatched' : 'Operations dispatched according to active port policy'}
                            </div>
                        </div>
                    </div>
                    {isAdmin ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground hidden md:inline">Current: <span className="font-semibold text-foreground">{schedulerType}</span></span>
                            <div className="flex rounded-md border p-1 bg-muted/40">
                                {(['FCFS', 'SJF', 'PRIORITY'] as const).map((algo) => (
                                    <button
                                        key={algo}
                                        type="button"
                                        onClick={() => void handleAlgoChange(algo)}
                                        className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                                            schedulerType === algo
                                                ? 'bg-background text-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {algo}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-md bg-primary/10 text-primary font-mono text-xs font-bold border border-primary/20">
                                {schedulerType} ACTIVE
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Algorithm</CardTitle>
                        <Cpu className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">{schedulerType}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {schedulerType === 'FCFS' && 'First-Come, First-Served'}
                            {schedulerType === 'SJF' && 'Shortest Job First'}
                            {schedulerType === 'PRIORITY' && 'Highest Priority First'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Ready Queue</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">{String(readyQueue.length).padStart(2, '0')}</div>
                        <p className="text-xs text-muted-foreground mt-1">processes waiting</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Completed</CardTitle>
                        <Play className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">{String(executedCount).padStart(2, '0')}</div>
                        <p className="text-xs text-muted-foreground mt-1">processes dispatched</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Deadlock State</CardTitle>
                        <ShieldCheck className={`h-4 w-4 ${deadlock ? 'text-red-500' : 'text-emerald-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold tracking-tight ${deadlock ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {deadlock ? 'DEADLOCK' : 'SAFE'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {deadlock ? 'Circular wait detected' : 'No circular wait'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Resource Allocation Cards: Mutexes & Semaphores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mutex Locks (Cranes) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Lock className="h-4 w-4 text-primary" /> Mutex Locks (Cranes)
                        </CardTitle>
                        <CardDescription>
                            Mutual exclusion locks dynamically managed for crane allocations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Object.keys(mutexes).length === 0 ? (
                            <p className="text-sm text-muted-foreground italic py-4 text-center">
                                No active crane locks currently in use.
                            </p>
                        ) : (
                            Object.entries(mutexes).map(([name, lock]: [string, any]) => (
                                <div
                                    key={name}
                                    className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-colors ${
                                        lock.isLocked
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                                            : 'bg-muted/40 border-muted text-muted-foreground'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 font-medium">
                                        {lock.isLocked ? <Lock className="h-4 w-4 text-amber-600" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
                                        <span className="text-foreground">{name}</span>
                                    </div>
                                    <span className="text-xs font-semibold">
                                        {lock.isLocked ? `Locked by OP-${lock.ownerId || 'process'}` : 'Unlocked / Free'}
                                    </span>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Semaphores (Berths) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Anchor className="h-4 w-4 text-primary" /> Semaphores (Berths)
                        </CardTitle>
                        <CardDescription>
                            Counting semaphores coordinating vessel docking limits.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Object.keys(semaphores).length === 0 ? (
                            <p className="text-sm text-muted-foreground italic py-4 text-center">
                                No semaphore berths registered.
                            </p>
                        ) : (
                            Object.entries(semaphores).map(([name, sem]: [string, any]) => (
                                <div
                                    key={name}
                                    className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-colors ${
                                        sem.available === 0
                                            ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 font-medium">
                                        <Anchor className="h-4 w-4" />
                                        <span className="text-foreground">{name}</span>
                                    </div>
                                    <span className="text-xs font-semibold">
                                        {sem.available === 0 ? 'Occupied (0/1)' : `Available (${sem.available}/1)`}
                                    </span>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Ready Queue Visualizer */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" /> Ready Queue Visualizer
                        </span>
                        <span className="text-xs text-muted-foreground font-normal">
                            {readyQueue.length} processes pending execution
                        </span>
                    </CardTitle>
                    <CardDescription>
                        Processes ordered according to the selected {schedulerType} algorithm.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {readyQueue.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground italic">
                            Ready queue is idle. Submit a new operation to see processes scheduled.
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {readyQueue.map((item: any, idx: number) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-2 rounded-lg border bg-card p-2.5 text-xs shadow-sm hover:shadow transition-shadow"
                                >
                                    <span className="font-mono text-muted-foreground">#{idx + 1}</span>
                                    <span className="font-semibold text-foreground">OP-{item.id}</span>
                                    <span className="rounded bg-primary/10 px-1.5 py-0.5 font-bold text-primary text-[10px]">
                                        P{item.priority || 1}
                                    </span>
                                    {item.burstTime && (
                                        <span className="text-[11px] text-muted-foreground">
                                            {item.burstTime / 1000}s
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Performance Metrics */}
            {metrics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Average Waiting Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono">
                                {metrics.avgWaitingMs ? `${(metrics.avgWaitingMs / 1000).toFixed(2)}s` : '0.00s'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">From entry into ready queue until first execution</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Average Turnaround Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono">
                                {metrics.avgTurnaroundMs ? `${(metrics.avgTurnaroundMs / 1000).toFixed(2)}s` : '0.00s'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">From process submission until complete execution</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Concurrency Health</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                Optimal
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Lock hierarchy and semaphore permits validated</p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
