import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, X, Truck, Anchor, AlertCircle, CheckCircle2, RefreshCw, Warehouse } from 'lucide-react';
import { api } from '../lib/api';

export function EquipmentPage() {
    const [Equipments, setEquipments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [name, setName] = useState('');
    const [type, setType] = useState<string>('Berth');
    const [EquipmentId, setEquipmentId] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            setEquipments(await api.Equipments.list());
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, []);

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setError('');
        setSuccess('');
        if (!name.trim()) { setError('Equipment name is required'); setSubmitting(false); return; }
        try {
            await api.Equipments.create({
                name: name.trim(),
                type,
                Equipment_id: EquipmentId.trim() || undefined,
            });
            setSuccess('Equipment added successfully to database');
            setShowCreate(false);
            setName('');
            setEquipmentId('');
            void load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            await api.Equipments.update(id, { status });
            void load();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Move this Equipment to Trash?')) return;
        try {
            await api.Equipments.delete(id);
            setSuccess('Equipment moved to Trash Bin');
            void load();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const typeIcon = (t: string) => {
        if (t === 'Berth') return <Anchor size={14} />;
        if (t === 'Crane') return <Truck size={14} />;
        if (t === 'Warehouse') return <Warehouse size={14} />;
        return <Truck size={14} />;
    };

    return (
        <div className="page-content">
            <div className="page-title-row">
                <div>
                    <p className="page-eyebrow">PORT INFRASTRUCTURE</p>
                    <h1>Equipments</h1>
                    <p className="subtitle">Manage berths, cranes, trucks, and warehouses</p>
                </div>
                <div className="panel-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => void load()} disabled={loading}>
                        <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus size={14} /> Add Equipment
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

            {Equipments.length === 0 && !loading ? (
                <div className="panel">
                    <div className="panel-body">
                        <div className="empty-state">
                            <Truck />
                            <h3>No records found.</h3>
                            <p>No port infrastructure registered in the database. Add berths, cranes, or trucks to begin.</p>
                            <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: '0.75rem' }}>
                                <Plus size={14} /> Add First Equipment
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="panel">
                    <div className="panel-header">
                        <h2><Truck size={16} /> All Equipments</h2>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{Equipments.length} total</span>
                    </div>
                    {loading ? (
                        <div className="panel-body"><p style={{ color: 'var(--muted)' }}>Loading Equipments from database...</p></div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr><th>ID</th><th>Name</th><th>Type</th><th>Status</th><th>Assigned To</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {Equipments.map(r => (
                                        <tr key={r.id}>
                                            <td><span className="ref-code">{r.Equipment_id}</span></td>
                                            <td>
                                                <div className="Equipment-name">
                                                    {typeIcon(r.type)} <span>{r.name}</span>
                                                </div>
                                            </td>
                                            <td>{r.type}</td>
                                            <td>
                                                <select
                                                    className="badge"
                                                    value={r.status}
                                                    onChange={e => void handleUpdateStatus(r.id, e.target.value)}
                                                    style={{
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        background: r.status === 'Available' ? '#dcfce7' : r.status === 'Occupied' ? '#ffedd5' : r.status === 'Maintenance' ? '#fee2e2' : '#dbeafe',
                                                        color: r.status === 'Available' ? '#15803d' : r.status === 'Occupied' ? '#c2410c' : r.status === 'Maintenance' ? '#b91c1c' : '#1d4ed8'
                                                    }}
                                                >
                                                    <option>Available</option>
                                                    <option>Occupied</option>
                                                    <option>Running</option>
                                                    <option>Busy</option>
                                                    <option>Maintenance</option>
                                                </select>
                                            </td>
                                            <td>{r.assigned_to || '—'}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn-icon danger"
                                                    onClick={() => void handleDelete(r.id)}
                                                    title="Move to Trash"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3><Plus size={16} /> Add Port Equipment</h3>
                            <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Equipment Name *</label>
                                        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Quay Crane 03" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Equipment Type</label>
                                        <select value={type} onChange={e => setType(e.target.value)}>
                                            <option>Berth</option>
                                            <option>Crane</option>
                                            <option>Truck</option>
                                            <option>Warehouse</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Custom ID (Optional)</label>
                                        <input value={EquipmentId} onChange={e => setEquipmentId(e.target.value)} placeholder="e.g. QC-03" />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-foot">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>Add Equipment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

