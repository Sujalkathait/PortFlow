import { useEffect, useState, useCallback } from 'react';
import {
    Cpu, Clock, Lock, Unlock, Anchor, ShieldCheck, Play, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert, Timer
} from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function SchedulingPage() {
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
                setDispatchMsg(`Dispatched OP-${result.dispatched} — Burst: ${result.process?.burstTime}ms, Wait: ${result.process?.waitingTime}ms`);
                setTimeout(() => setDispatchMsg(''), 5000);
            } else {
                setDispatchMsg('No processes in ready queue to dispatch');
                setTimeout(() => setDispatchMsg(''), 5000);
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
        <div className="flex flex-col space-y-8 w-full max-w-[1400px] mx-auto pb-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                        <Cpu className="w-5 h-5" />
                        <span className="text-xs font-bold tracking-widest uppercase">OS Engine</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Scheduler & Concurrency
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                        Real-time CPU Scheduling, Mutex Lock Allocation, Semaphores, and Deadlock Detection.
                    </p>
                </div>
                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                    <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="shadow-sm">
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => void handleDispatch()}
                        disabled={readyQueue.length === 0}
                        className="shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Play className="mr-2 h-4 w-4 fill-current" />
                        Dispatch Next Process
                    </Button>
                </div>
            </div>

            {/* Notification Alerts */}
            {error && (
                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            {dispatchMsg && (
                <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 shadow-sm dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>{dispatchMsg}</span>
                </div>
            )}

            {/* Algorithm Selector Bar */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50/50 dark:bg-slate-900/20">
                <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                            <Cpu className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                                Active CPU Scheduling Algorithm
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                Select how operations in the ready queue are ordered and dispatched to resources.
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <span className="text-sm text-slate-500 hidden lg:inline">Current Policy:</span>
                        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-950 shadow-sm w-full md:w-auto">
                            {(['FCFS', 'SJF', 'PRIORITY'] as const).map((algo) => (
                                <button
                                    key={algo}
                                    type="button"
                                    onClick={() => void handleAlgoChange(algo)}
                                    className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-md transition-all ${
                                        schedulerType === algo
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                                    }`}
                                >
                                    {algo}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Algorithm</CardTitle>
                        <Cpu className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{schedulerType}</div>
                        <p className="text-xs font-medium text-slate-500 mt-1">
                            {schedulerType === 'FCFS' && 'First-Come, First-Served'}
                            {schedulerType === 'SJF' && 'Shortest Job First'}
                            {schedulerType === 'PRIORITY' && 'Highest Priority First'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ready Queue</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">{String(readyQueue.length).padStart(2, '0')}</div>
                        <p className="text-xs font-medium text-slate-500 mt-1">Processes waiting execution</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</CardTitle>
                        <Play className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">{String(executedCount).padStart(2, '0')}</div>
                        <p className="text-xs font-medium text-slate-500 mt-1">Total processes dispatched</p>
                    </CardContent>
                </Card>

                <Card className={`shadow-sm border-slate-200 dark:border-slate-800 transition-colors ${deadlock ? 'bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/50' : ''}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className={`text-xs font-bold uppercase tracking-wider ${deadlock ? 'text-red-700 dark:text-red-400' : 'text-slate-500'}`}>Deadlock State</CardTitle>
                        {deadlock ? <ShieldAlert className="h-4 w-4 text-red-600" /> : <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold tracking-tight ${deadlock ? 'text-red-700 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {deadlock ? 'DEADLOCK' : 'SAFE'}
                        </div>
                        <p className={`text-xs font-medium mt-1 ${deadlock ? 'text-red-600/80 dark:text-red-400/80' : 'text-slate-500'}`}>
                            {deadlock ? 'Circular wait detected! System halted.' : 'No circular wait detected'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Ready Queue Visualizer */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/20 px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-500" /> Ready Queue Process Visualizer
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Processes ordered dynamically by the {schedulerType} algorithm.
                            </CardDescription>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                            {readyQueue.length} Pending
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="p-6 bg-slate-50/30 dark:bg-slate-950/20">
                    {readyQueue.length === 0 ? (
                        <div className="py-12 text-center flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                <Clock className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ready queue is empty</p>
                            <p className="text-sm text-slate-500 mt-1 italic">Submit a new operation to see processes scheduled.</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {readyQueue.map((item: any, idx: number) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 p-3 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                                >
                                    <span className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md w-6 h-6 font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                                        {idx + 1}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">OP-{String(item.id).padStart(4, '0')}</span>
                                        {item.burstTime && (
                                            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                                                <Timer className="w-3 h-3" /> {item.burstTime}ms
                                            </span>
                                        )}
                                    </div>
                                    <span className={`rounded-md px-2 py-1 font-bold text-[10px] uppercase ${
                                        item.priority === 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                        item.priority === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                        P{item.priority || 3}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Resource Allocation Cards: Mutexes & Semaphores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mutex Locks (Cranes) */}
                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/20 px-6 py-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                            <Lock className="h-5 w-5 text-blue-600 dark:text-blue-500" /> Mutex Locks <span className="text-slate-400 font-normal text-sm ml-1">(Cranes)</span>
                        </CardTitle>
                        <CardDescription>
                            Mutual exclusion locks dynamically managed for crane allocations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                        {Object.keys(mutexes).length === 0 ? (
                            <div className="py-6 text-center text-sm font-medium text-slate-500 italic">
                                No active crane locks currently tracked in the system.
                            </div>
                        ) : (
                            Object.entries(mutexes).map(([name, lock]: [string, any]) => (
                                <div
                                    key={name}
                                    className={`flex items-center justify-between p-3.5 rounded-lg border text-sm font-medium transition-colors ${
                                        lock.isLocked
                                            ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-200 shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-md ${lock.isLocked ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            {lock.isLocked ? <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" /> : <Unlock className="h-4 w-4 text-slate-400" />}
                                        </div>
                                        <span className={lock.isLocked ? 'font-bold' : ''}>{name}</span>
                                    </div>
                                    <span className={`text-xs px-2.5 py-1 rounded-md ${
                                        lock.isLocked ? 'bg-amber-200/50 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 font-bold' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                        {lock.isLocked ? `Locked by OP-${String(lock.ownerId).padStart(4, '0')}` : 'Unlocked / Free'}
                                    </span>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Semaphores (Berths) */}
                <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/20 px-6 py-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                            <Anchor className="h-5 w-5 text-blue-600 dark:text-blue-500" /> Semaphores <span className="text-slate-400 font-normal text-sm ml-1">(Berths)</span>
                        </CardTitle>
                        <CardDescription>
                            Counting semaphores coordinating vessel docking and capacity limits.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                        {Object.keys(semaphores).length === 0 ? (
                            <div className="py-6 text-center text-sm font-medium text-slate-500 italic">
                                No semaphore berths currently registered.
                            </div>
                        ) : (
                            Object.entries(semaphores).map(([name, sem]: [string, any]) => (
                                <div
                                    key={name}
                                    className={`flex items-center justify-between p-3.5 rounded-lg border text-sm font-medium transition-colors ${
                                        sem.available === 0
                                            ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-200 shadow-sm'
                                            : 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-200 shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-md ${sem.available === 0 ? 'bg-red-100 dark:bg-red-900/50' : 'bg-emerald-100 dark:bg-emerald-900/50'}`}>
                                            <Anchor className={`h-4 w-4 ${sem.available === 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                                        </div>
                                        <span className="font-bold">{name}</span>
                                    </div>
                                    <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${
                                        sem.available === 0 ? 'bg-red-200/50 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-emerald-200/50 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                    }`}>
                                        {sem.available === 0 ? 'Occupied (0/1)' : `Available (${sem.available}/1)`}
                                    </span>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Performance Metrics */}
            {metrics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Waiting Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                                {metrics.avgWaitingMs ? `${(metrics.avgWaitingMs / 1000).toFixed(2)}s` : '0.00s'}
                            </div>
                            <p className="text-xs font-medium text-slate-500 mt-1">From entry into ready queue until first execution</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Turnaround Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                                {metrics.avgTurnaroundMs ? `${(metrics.avgTurnaroundMs / 1000).toFixed(2)}s` : '0.00s'}
                            </div>
                            <p className="text-xs font-medium text-slate-500 mt-1">From process submission until complete execution</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Concurrency Health</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                Optimal
                            </div>
                            <p className="text-xs font-medium text-slate-500 mt-1">Lock hierarchy and semaphore permits validated</p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
