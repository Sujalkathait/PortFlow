import { useEffect, useState, type FormEvent } from 'react';
import {
    Plus, Trash2, Play, CheckCircle2, X, Sliders,
    AlertCircle, RefreshCw, Anchor
} from 'lucide-react';
import { api } from '../lib/api';
export function OperationsPage() {
    const [operations, setOperations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editOp, setEditOp] = useState<any>(null);

    // Create form state
    const [formType, setFormType] = useState('Cargo Discharge');
    const [formShip, setFormShip] = useState('');
    const [formCrane, setFormCrane] = useState('Crane A');
    const [formBerth, setFormBerth] = useState('Berth 1');
    const [formPriority, setFormPriority] = useState('1');
    const [formBurst, setFormBurst] = useState('4');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api.operations.list();
            setOperations(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, []);

    const clearMessages = () => { setError(''); setSuccess(''); };

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        clearMessages();
        if (!formShip.trim()) { setError('Ship name is required'); setSubmitting(false); return; }
        try {
            await api.operations.create({
                operationType: formType,
                shipName: formShip.trim(),
                craneId: formCrane,
                berthId: formBerth,
                priority: Number(formPriority),
                burstDuration: Number(formBurst) * 1000,
            });
            setSuccess('Operation created and added to scheduler queue');
            setShowCreate(false);
            setFormShip('');
            void load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        clearMessages();
        try {
            await api.operations.update(id, { status });
            setSuccess(`Operation OP-${id} updated to ${status}`);
            setEditOp(null);
            void load();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleDelete = async (id: number) => {
        clearMessages();
        if (!window.confirm(`Move operation OP-${id} to Trash?`)) return;
        try {
            await api.operations.delete(id);
            setSuccess(`Operation OP-${id} moved to Trash Bin`);
            void load();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleDispatch = async () => {
        clearMessages();
        try {
            const result = await api.operations.dispatch();
            if (result.dispatched) {
                setSuccess(`Process dispatched via FCFS scheduler — Operation OP-${result.dispatched} completed`);
            } else {
                setError('No processes in ready queue to dispatch');
            }
            void load();
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="page-content">
            <div className="page-title-row">
                <div>
                    <p className="page-eyebrow">PORT OPERATIONS & CRUD</p>
                    <h1>Operations Management</h1>
                    <p className="subtitle">Create, manage, and schedule port operations</p>
                </div>
                <div className="panel-actions">
                    <button className="btn btn-secondary" onClick={() => void load()} disabled={loading}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus size={14} /> New Operation
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#b91c1c', fontSize: '0.88rem' }}>
                    <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />{error}
                </div>
            )}
            {success && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#15803d', fontSize: '0.88rem' }}>
                    <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />{success}
                </div>
            )}

            {/* Dispatch Button */}
            <div style={{ marginBottom: '1rem' }}>
                <button
                    className="btn btn-primary"
                    onClick={() => void handleDispatch()}
                    disabled={!operations.some(o => o.status === 'Queued')}
                    style={{ background: '#0b192c', borderColor: '#1e3a5f' }}
                >
                    <Play size={14} /> Dispatch Next Process (FCFS Scheduler)
                </button>
                <span style={{ marginLeft: '0.75rem', fontSize: '0.82rem', color: 'var(--muted)' }}>
                    {operations.filter(o => o.status === 'Queued').length} in ready queue
                </span>
            </div>

            {/* Operations Table */}
            <div className="panel">
                <div className="panel-header">
                    <h2><Anchor size={16} /> Active Operations</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{operations.length} records</span>
                </div>
                {loading ? (
                    <div className="panel-body"><p style={{ color: 'var(--muted)' }}>Loading operations...</p></div>
                ) : operations.length === 0 ? (
                    <div className="panel-body">
                        <div className="empty-state">
                            <Anchor />
                            <h3>No operations found</h3>
                            <p>Click "+ New Operation" to create your first port operation. It will be submitted to the OS scheduler.</p>
                            <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: '0.75rem' }}>
                                <Plus size={14} /> Create First Operation
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Ref</th><th>Type</th><th>Ship</th><th>Berth / Crane</th>
                                    <th>Priority</th><th>Status</th><th>Timing</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {operations.map((op) => (
                                    <tr key={op.id}>
                                        <td><span className="ref-code">OP-{op.id}</span></td>
                                        <td><strong>{op.operation_type}</strong></td>
                                        <td>{op.ship_name}</td>
                                        <td>
                                            <span style={{ fontSize: '0.82rem', background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#475569' }}>
                                                {op.berth_id} · {op.crane_id}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${op.priority >= 3 ? 'cancelled' : op.priority === 2 ? 'occupied' : 'in-yard'}`}>
                                                {op.priority >= 3 ? 'Critical' : op.priority === 2 ? 'High' : 'Normal'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${op.status === 'Running' ? 'running' : op.status === 'Completed' ? 'completed' : op.status === 'Cancelled' ? 'cancelled' : 'queued'}`}>
                                                <span className="badge-dot" /> {op.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                                            {op.turnaround_time_ms
                                                ? `Done in ${(op.turnaround_time_ms / 1000).toFixed(1)}s`
                                                : op.start_time ? 'Executing' : 'Queued'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                {op.status === 'Queued' && (
                                                    <button className="btn-icon info" onClick={() => void handleUpdateStatus(op.id, 'Running')} title="Start">
                                                        <Play size={13} />
                                                    </button>
                                                )}
                                                {op.status === 'Running' && (
                                                    <button className="btn-icon success" onClick={() => void handleUpdateStatus(op.id, 'Completed')} title="Complete">
                                                        <CheckCircle2 size={13} />
                                                    </button>
                                                )}
                                                <button className="btn-icon" onClick={() => setEditOp(op)} title="Edit">
                                                    <Sliders size={13} />
                                                </button>
                                                <button className="btn-icon danger" onClick={() => void handleDelete(op.id)} title="Move to Trash">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* CREATE MODAL */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3><Plus size={16} /> Create New Operation</h3>
                            <button className="btn-ghost" onClick={() => setShowCreate(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Operation Type</label>
                                        <select value={formType} onChange={e => setFormType(e.target.value)}>
                                            <option>Cargo Discharge</option>
                                            <option>Bulk Grain Unloading</option>
                                            <option>Refrigerated Cargo Inspection</option>
                                            <option>Hazmat Staging</option>
                                            <option>Bunkering Fuel Transfer</option>
                                            <option>Vehicle Dispatch</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Ship Name *</label>
                                        <input value={formShip} onChange={e => setFormShip(e.target.value)} placeholder="Enter ship name" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Berth (Semaphore)</label>
                                        <select value={formBerth} onChange={e => setFormBerth(e.target.value)}>
                                            <option>Berth 1</option><option>Berth 2</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Crane (Mutex Lock)</label>
                                        <select value={formCrane} onChange={e => setFormCrane(e.target.value)}>
                                            <option>Crane A</option><option>Crane B</option><option>None</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Priority</label>
                                        <select value={formPriority} onChange={e => setFormPriority(e.target.value)}>
                                            <option value="1">1 — Normal</option>
                                            <option value="2">2 — High</option>
                                            <option value="3">3 — Critical</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Burst Duration (seconds)</label>
                                        <input type="number" min="1" max="60" value={formBurst} onChange={e => setFormBurst(e.target.value)} required />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-foot">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>Submit to Ready Queue</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {editOp && (
                <div className="modal-overlay" onClick={() => setEditOp(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3><Sliders size={16} /> Update OP-{editOp.id}</h3>
                            <button className="btn-ghost" onClick={() => setEditOp(null)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group full">
                                    <label>Change Status</label>
                                    <select value={editOp.status} onChange={e => void handleUpdateStatus(editOp.id, e.target.value)}>
                                        <option value="Queued">Queued (In Ready Queue)</option>
                                        <option value="Running">Running (Acquired Locks)</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-foot">
                            <button className="btn btn-secondary" onClick={() => setEditOp(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

