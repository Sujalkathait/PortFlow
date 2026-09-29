import { useEffect, useState } from 'react';
import {
    Cpu, Clock, Lock, Unlock, Anchor, ShieldCheck, Play, RefreshCw, AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';

export function SchedulingPage() {
    const [osState, setOsState] = useState<any>(null);
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dispatchMsg, setDispatchMsg] = useState('');

    const load = async () => {
        setLoading(true); setError('');
        try {
            const state = await api.os.state();
            setOsState(state);
            setMetrics(state.metrics);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
        const interval = setInterval(() => void load(), 5000);
        return () => clearInterval(interval);
    }, []);

    const handleDispatch = async () => {
        try {
            const result = await api.operations.dispatch();
            if (result.dispatched) {
                setDispatchMsg(`FCFS dispatched OP-${result.dispatched} — Burst: ${result.process?.burstTime}ms, Wait: ${result.process?.waitingTime}ms, Turnaround: ${result.process?.turnaroundTime}ms`);
            } else {
                setDispatchMsg('No processes in ready queue');
            }
            void load();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const readyQueue = osState?.readyQueue || [];
    const mutexes = osState?.mutexes || {};
    const semaphores = osState?.semaphores || {};
    const deadlock = osState?.deadlockDetected || false;
    const executedCount = osState?.executedCount || 0;
    const schedulerType = osState?.schedulingAlgorithm || 'FCFS';

    const handleAlgoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:10000'}/api/os/algorithm`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('portflow_auth_token')}`
                },
                body: JSON.stringify({ algorithm: e.target.value })
            });
            void load();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="page-content">
            <div className="page-title-row">
                <div>
                    <p className="page-eyebrow">OPERATING SYSTEM ENGINE</p>
                    <h1>OS Scheduler & Concurrency Monitor</h1>
                    <p className="subtitle">FCFS CPU Scheduling · Mutex Lock Allocation · Semaphore · Deadlock Detection</p>
                </div>
                <div className="panel-actions">
                    <button className="btn btn-secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> Refresh</button>
                    <button className="btn btn-primary" onClick={() => void handleDispatch()}
                        disabled={readyQueue.length === 0}
                        style={{ background: '#0b192c', borderColor: '#1e3a5f' }}>
                        <Play size={14} /> Dispatch Next
                    </button>
                    <select 
                        value={schedulerType} 
                        onChange={handleAlgoChange}
                        className="btn" 
                        style={{ background: '#0f172a', borderColor: '#1e293b', color: 'white', marginLeft: '0.5rem' }}
                    >
                        <option value="FCFS">FCFS</option>
                        <option value="SJF">SJF (Shortest Job First)</option>
                        <option value="PRIORITY">PRIORITY</option>
                    </select>
                </div>
            </div>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#b91c1c', fontSize: '0.88rem' }}><AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />{error}</div>}
            {dispatchMsg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#15803d', fontSize: '0.88rem' }}>{dispatchMsg}</div>}

            {/* OS Stat Cards */}
            <div className="os-panel">
                <div className="panel-header" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <h2 style={{ color: '#f1f5f9' }}><Cpu size={16} style={{ color: '#38bdf8' }} /> Scheduling Status</h2>
                    <span className={`deadlock-badge ${deadlock ? 'danger' : 'safe'}`}>
                        <ShieldCheck size={14} />
                        {deadlock ? 'DEADLOCK DETECTED' : 'Safe State — No Deadlock'}
                    </span>
                </div>

                <div className="os-inner-grid">
                    {/* Scheduler Info */}
                    <div className="os-card">
                        <div className="os-card-title"><Cpu size={14} /> Scheduler</div>
                        <p className="os-card-value">{schedulerType}</p>
                        <p className="os-card-sub">
                            {schedulerType === 'FCFS' && 'First Come First Serve'}
                            {schedulerType === 'SJF' && 'Shortest Job First'}
                            {schedulerType === 'PRIORITY' && 'Highest Priority First'}
                        </p>
                    </div>

                    {/* Ready Queue */}
                    <div className="os-card">
                        <div className="os-card-title"><Clock size={14} /> Ready Queue</div>
                        <p className="os-card-value">{String(readyQueue.length).padStart(2, '0')}</p>
                        <p className="os-card-sub">processes waiting</p>
                    </div>

                    {/* Executed */}
                    <div className="os-card">
                        <div className="os-card-title"><Play size={14} /> Executed</div>
                        <p className="os-card-value">{String(executedCount).padStart(2, '0')}</p>
                        <p className="os-card-sub">processes completed</p>
                    </div>
                </div>

                {/* Detailed sections */}
                <div className="os-inner-grid">
                    {/* FCFS Ready Queue Detail */}
                    <div className="os-card">
                        <div className="os-card-title"><Clock size={14} /> Ready Queue Detail</div>
                        {readyQueue.length === 0 ? (
                            <p className="os-card-sub" style={{ fontStyle: 'italic' }}>Queue is idle — no processes waiting</p>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {readyQueue.map((item: any, idx: number) => (
                                    <div className="os-queue-chip" key={item.id}>
                                        <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>#{idx + 1}</span>
                                        <span>{item.id}</span>
                                        <span style={{ background: '#0284c7', color: '#fff', fontSize: '0.65rem', padding: '0.05rem 0.25rem', borderRadius: '3px', fontWeight: 700 }}>
                                            P{item.priority || 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mutex Locks */}
                    <div className="os-card">
                        <div className="os-card-title"><Lock size={14} /> Mutex Locks (Cranes)</div>
                        {Object.keys(mutexes).length === 0 ? (
                            <p className="os-card-sub" style={{ fontStyle: 'italic' }}>No mutex Equipments registered. Create operations to activate.</p>
                        ) : (
                            Object.entries(mutexes).map(([name, lock]: [string, any]) => (
                                <div className={`os-mutex-row ${lock.isLocked ? 'locked' : 'free'}`} key={name}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {lock.isLocked ? <Lock size={13} /> : <Unlock size={13} />}
                                        <strong>{name}</strong>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                        {lock.isLocked ? `Locked by ${lock.ownerId || 'process'}` : 'Free'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Semaphores */}
                    <div className="os-card">
                        <div className="os-card-title"><Anchor size={14} /> Semaphores (Berths)</div>
                        {Object.keys(semaphores).length === 0 ? (
                            <p className="os-card-sub" style={{ fontStyle: 'italic' }}>No semaphore Equipments registered.</p>
                        ) : (
                            Object.entries(semaphores).map(([name, sem]: [string, any]) => (
                                <div className={`os-mutex-row ${sem.available === 0 ? 'locked' : 'free'}`} key={name}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Anchor size={13} />
                                        <strong>{name}</strong>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                        {sem.available === 0 ? 'Occupied (0/1)' : `Available (${sem.available}/1)`}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Metrics */}
                {metrics && (
                    <div className="os-inner-grid">
                        <div className="os-card">
                            <div className="os-card-title"><Clock size={14} /> Avg Waiting Time</div>
                            <p className="os-card-value">{metrics.avgWaitingMs ? `${(metrics.avgWaitingMs / 1000).toFixed(1)}s` : '—'}</p>
                            <p className="os-card-sub">from queue to execution</p>
                        </div>
                        <div className="os-card">
                            <div className="os-card-title"><Clock size={14} /> Avg Turnaround</div>
                            <p className="os-card-value">{metrics.avgTurnaroundMs ? `${(metrics.avgTurnaroundMs / 1000).toFixed(1)}s` : '—'}</p>
                            <p className="os-card-sub">from creation to completion</p>
                        </div>
                        <div className="os-card">
                            <div className="os-card-title"><ShieldCheck size={14} /> Deadlock</div>
                            <p className="os-card-value" style={{ color: deadlock ? '#f87171' : '#34d399' }}>{deadlock ? 'DETECTED' : 'CLEAR'}</p>
                            <p className="os-card-sub">circular wait analysis</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

