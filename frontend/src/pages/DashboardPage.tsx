import { useEffect, useState } from 'react';
import {
    Ship, Anchor, Truck, CheckCircle2, Play,
    AlertCircle, RefreshCw, Timer
} from 'lucide-react';
import { api } from '../lib/api';

export function DashboardPage({ role }: { role: string }) {
    const [_, setMetrics] = useState<any>(null);
    const [operations, setOperations] = useState<any[]>([]);
    const [ships, setShips] = useState<any[]>([]);
    const [__, setCargos] = useState<any[]>([]);
    const [Equipments, setEquipments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const [m, ops, sh, cnts, res] = await Promise.all([
                api.analytics.get(),
                api.operations.list(),
                api.ships.list(),
                api.Cargos.list(),
                api.Equipments.list(),
            ]);
            setMetrics(m);
            setOperations(ops);
            setShips(sh);
            setCargos(cnts);
            setEquipments(res);
        } catch (e: any) {
            setError(e.message || 'Failed to load dashboard data from backend');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, []);

    // Calculate metrics exactly as requested by Phase 2 design
    const totalShips = ships.length;
    const activeOperations = operations.filter(o => o.status !== 'Completed').length;
    const readyJobs = operations.filter(o => o.status === 'Ready').length;
    const runningJobs = operations.filter(o => o.status === 'Running').length;
    const waitingJobs = operations.filter(o => o.status === 'Waiting' || o.status === 'Queued').length;
    const completedJobs = operations.filter(o => o.status === 'Completed').length;
    const availableBerths = Equipments.filter(r => r.type === 'Berth' && r.status === 'Available').length;
    const availableCranes = Equipments.filter(r => r.type === 'Crane' && r.status === 'Available').length;
    const availableTrucks = Equipments.filter(r => r.type === 'Truck' && r.status === 'Available').length;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const recentOps = operations.slice(0, 10);
    
    // Operator specific metrics
    const completedOps = operations.filter(o => o.status === 'Completed' && o.turnaround_time_ms);
    const avgWait = completedOps.length ? Math.round(completedOps.reduce((a, b) => a + (b.waiting_time_ms || 0), 0) / completedOps.length / 1000) : 0;
    const avgTurnaround = completedOps.length ? Math.round(completedOps.reduce((a, b) => a + (b.turnaround_time_ms || 0), 0) / completedOps.length / 1000) : 0;

    return (
        <div className="page-content">
            <div className="page-title-row">
                <div>
                    <p className="page-eyebrow">{role.toUpperCase()} DASHBOARD</p>
                    <h1>PORT OPERATIONS OVERVIEW</h1>
                    <p className="subtitle">
                        Real-time telemetry, OS Process Status, and DBMS allocations
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p className="page-title-date">{dateStr}</p>
                    <p className="page-title-date">{timeStr}</p>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => void load()}
                        disabled={loading}
                        style={{ marginTop: '0.5rem' }}
                    >
                        <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#b91c1c', fontSize: '0.88rem' }}>
                    <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />{error}
                </div>
            )}

            {/* Stat Cards */}
            <section className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {role === 'Admin' ? (
                    <>
                        <div className="stat-card">
                            <div className="stat-icon blue"><Ship size={22} /></div>
                            <div className="stat-info">
                                <strong>{loading ? '—' : totalShips}</strong>
                                <p>Total Ships</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green"><Anchor size={22} /></div>
                            <div className="stat-info">
                                <strong>{loading ? '—' : activeOperations}</strong>
                                <p>Active Operations</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon blue"><Timer size={22} /></div>
                            <div className="stat-info">
                                <strong>{loading ? '—' : readyJobs}</strong>
                                <p>Ready Jobs</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon orange"><Play size={22} /></div>
                            <div className="stat-info">
                                <strong>{loading ? '—' : runningJobs}</strong>
                                <p>Running Jobs</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon red"><AlertCircle size={22} /></div>
                            <div className="stat-info">
                                <strong>{loading ? '—' : waitingJobs}</strong>
                                <p>Waiting Jobs</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon purple"><CheckCircle2 size={22} /></div>
                            <div className="stat-info">
                                <strong>{loading ? '—' : completedJobs}</strong>
                                <p>Completed Jobs</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon blue"><Anchor size={22} /></div>
                            <div className="stat-info">
                                <strong>{loading ? '—' : availableBerths}</strong>
                                <p>Available Berths</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon orange"><Truck size={22} /></div>
                            <div className="stat-info">
                                <strong>{loading ? '—' : availableCranes}</strong>
                                <p>Available Cranes</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green"><Truck size={22} /></div>
                            <div className="stat-info">
                                <strong>{loading ? '—' : availableTrucks}</strong>
                                <p>Available Trucks</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="stat-card">
                            <div className="stat-icon green"><Anchor size={22} /></div>
                            <div className="stat-info">
                                <strong>{loading ? '—' : activeOperations}</strong>
                                <p>My Active Jobs</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon orange"><Play size={22} /></div>
                            <div className="stat-info">
                                <strong>{loading ? '—' : runningJobs}</strong>
                                <p>My Running Jobs</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon purple"><CheckCircle2 size={22} /></div>
                            <div className="stat-info">
                                <strong>{loading ? '—' : completedJobs}</strong>
                                <p>My Completed Jobs</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon blue"><Timer size={22} /></div>
                            <div className="stat-info">
                                <strong>{loading ? '—' : avgWait + 's'}</strong>
                                <p>Avg Waiting Time</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green"><Timer size={22} /></div>
                            <div className="stat-info">
                                <strong>{loading ? '—' : avgTurnaround + 's'}</strong>
                                <p>Avg Turnaround Time</p>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* Live Operations */}
            <div style={{ marginTop: '2rem' }}>
                <div className="panel">
                    <div className="panel-header">
                        <h2><Anchor size={16} /> LIVE OPERATIONS</h2>
                    </div>
                    {operations.length === 0 ? (
                        <div className="panel-body">
                            <div className="empty-state">
                                <Anchor />
                                <h3>No records found.</h3>
                                <p>No active operations in the database.</p>
                            </div>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Operation ID</th>
                                        <th>Ship Name</th>
                                        <th>Berth</th>
                                        <th>Status</th>
                                        <th>Process ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOps.map((op: any) => (
                                        <tr key={op.id}>
                                            <td><span className="ref-code">OP{op.id}</span></td>
                                            <td>{op.ship_name}</td>
                                            <td>{op.berth_id || '-'}</td>
                                            <td>
                                                <span className={`badge ${op.status.toLowerCase().replace(' ', '-')}`}>
                                                    <span className="badge-dot" /> {op.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td><span className="ref-code">{op.process_id || '-'}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

