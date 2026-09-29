import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, X, Ship, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

export function ShipsPage() {
    const [ships, setShips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [name, setName] = useState('');
    const [imo, setImo] = useState('');
    const [vesselType, setVesselType] = useState('Cargo');
    const [capacity, setCapacity] = useState('');
    const [berthId, setBerthId] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            setShips(await api.ships.list());
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
        if (!name.trim()) { setError('Ship name is required'); setSubmitting(false); return; }
        try {
            await api.ships.create({
                name: name.trim(),
                imo_number: imo.trim() || undefined,
                vessel_type: vesselType,
                capacity_teu: Number(capacity) || 0,
                berth_id: berthId || null,
            });
            setSuccess('Ship registered successfully in database');
            setShowCreate(false);
            setName('');
            setImo('');
            setCapacity('');
            setBerthId('');
            void load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            await api.ships.update(id, { status });
            setSuccess(`Ship status updated to ${status}`);
            void load();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Move this ship to Trash?')) return;
        try {
            await api.ships.delete(id);
            setSuccess('Ship moved to Trash Bin');
            void load();
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="page-content">
            <div className="page-title-row">
                <div>
                    <p className="page-eyebrow">VESSEL MANAGEMENT</p>
                    <h1>Ships Registry</h1>
                    <p className="subtitle">Register, track, and manage vessels in port</p>
                </div>
                <div className="panel-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => void load()} disabled={loading}>
                        <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus size={14} /> Register Ship
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

            <div className="panel">
                <div className="panel-header">
                    <h2><Ship size={16} /> Ships</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{ships.length} records</span>
                </div>
                {loading ? (
                    <div className="panel-body"><p style={{ color: 'var(--muted)' }}>Loading ships from database...</p></div>
                ) : ships.length === 0 ? (
                    <div className="panel-body">
                        <div className="empty-state">
                            <Ship />
                            <h3>No records found.</h3>
                            <p>No vessels registered in the port database. Click below to add a ship.</p>
                            <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: '0.75rem' }}>
                                <Plus size={14} /> Register First Ship
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th><th>IMO</th><th>Name</th><th>Type</th>
                                    <th>Capacity TEU</th><th>Status</th><th>Berth</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ships.map(s => (
                                    <tr key={s.id}>
                                        <td><span className="ref-code">S-{s.id}</span></td>
                                        <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{s.imo_number}</td>
                                        <td><strong>{s.name}</strong></td>
                                        <td>{s.vessel_type}</td>
                                        <td>{s.capacity_teu > 0 ? s.capacity_teu.toLocaleString() : '—'}</td>
                                        <td>
                                            <select
                                                className="badge"
                                                value={s.status}
                                                onChange={e => void handleUpdateStatus(s.id, e.target.value)}
                                                style={{
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    background: s.status === 'Docked' ? '#dcfce7' : s.status === 'Arriving' ? '#fef3c7' : '#fee2e2',
                                                    color: s.status === 'Docked' ? '#15803d' : s.status === 'Arriving' ? '#92400e' : '#b91c1c'
                                                }}
                                            >
                                                <option>Docked</option>
                                                <option>Arriving</option>
                                                <option>Departed</option>
                                            </select>
                                        </td>
                                        <td>{s.berth_id || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <button
                                                    type="button"
                                                    className="btn-icon danger"
                                                    onClick={() => void handleDelete(s.id)}
                                                    title="Move to Trash"
                                                >
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

            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3><Plus size={16} /> Register New Ship</h3>
                            <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Ship Name *</label>
                                        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. MV Ocean Star" required />
                                    </div>
                                    <div className="form-group">
                                        <label>IMO Number</label>
                                        <input value={imo} onChange={e => setImo(e.target.value)} placeholder="e.g. IMO-9876543" />
                                    </div>
                                    <div className="form-group">
                                        <label>Vessel Type</label>
                                        <select value={vesselType} onChange={e => setVesselType(e.target.value)}>
                                            <option>Cargo</option>
                                            <option>Bulk Carrier</option>
                                            <option>Tanker</option>
                                            <option>General Cargo</option>
                                            <option>Ro-Ro</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Capacity (TEU)</label>
                                        <input type="number" min="0" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 5000" />
                                    </div>
                                    <div className="form-group">
                                        <label>Assign Berth</label>
                                        <select value={berthId} onChange={e => setBerthId(e.target.value)}>
                                            <option value="">Not assigned</option>
                                            <option>Berth 1</option>
                                            <option>Berth 2</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-foot">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>Register Ship</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

