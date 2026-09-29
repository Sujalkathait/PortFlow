import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, X, Boxes, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

export function CargoPage() {
    const [Cargos, setCargos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [number, setNumber] = useState('');
    const [sizeType, setSizeType] = useState('20ft');
    const [weight, setWeight] = useState('');
    const [cargoType, setCargoType] = useState('');
    const [location, setLocation] = useState('');
    const [shipName, setShipName] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            setCargos(await api.Cargos.list());
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
        if (!number.trim()) { setError('Cargo number is required'); setSubmitting(false); return; }
        try {
            await api.Cargos.create({
                Cargo_number: number.trim(),
                size_type: sizeType,
                weight_tons: Number(weight) || 0,
                cargo_type: cargoType.trim() || 'General',
                current_location: location.trim() || 'Yard',
                ship_name: shipName.trim(),
            });
            setSuccess('Cargo registered successfully in database');
            setShowCreate(false);
            setNumber('');
            setWeight('');
            setCargoType('');
            setLocation('');
            setShipName('');
            void load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            await api.Cargos.update(id, { status });
            void load();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Move this Cargo to Trash?')) return;
        try {
            await api.Cargos.delete(id);
            setSuccess('Cargo moved to Trash Bin');
            void load();
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="page-content">
            <div className="page-title-row">
                <div>
                    <p className="page-eyebrow">CARGO TRACKING</p>
                    <h1>Cargos</h1>
                    <p className="subtitle">Track and manage Cargos through the port terminal</p>
                </div>
                <div className="panel-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => void load()} disabled={loading}>
                        <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus size={14} /> Add Cargo
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
                    <h2><Boxes size={16} /> Cargos</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{Cargos.length} records</span>
                </div>
                {loading ? (
                    <div className="panel-body"><p style={{ color: 'var(--muted)' }}>Loading Cargos from database...</p></div>
                ) : Cargos.length === 0 ? (
                    <div className="panel-body">
                        <div className="empty-state">
                            <Boxes />
                            <h3>No records found.</h3>
                            <p>No Cargos registered in the port system. Add a Cargo to track cargo.</p>
                            <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: '0.75rem' }}>
                                <Plus size={14} /> Add First Cargo
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Number</th><th>Size</th><th>Weight</th><th>Cargo</th>
                                    <th>Ship</th><th>Location</th><th>Status</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Cargos.map(c => (
                                    <tr key={c.id}>
                                        <td><span className="ref-code">{c.Cargo_number}</span></td>
                                        <td>{c.size_type}</td>
                                        <td>{c.weight_tons > 0 ? `${c.weight_tons}t` : '—'}</td>
                                        <td>{c.cargo_type}</td>
                                        <td>{c.ship_name || '—'}</td>
                                        <td>{c.current_location}</td>
                                        <td>
                                            <select
                                                className="badge"
                                                value={c.status}
                                                onChange={e => void handleUpdateStatus(c.id, e.target.value)}
                                                style={{
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    background: c.status === 'Cleared' ? '#dcfce7' : c.status === 'On Ship' ? '#ffedd5' : c.status === 'In Yard' ? '#e0e7ff' : '#cffafe',
                                                    color: c.status === 'Cleared' ? '#15803d' : c.status === 'On Ship' ? '#c2410c' : c.status === 'In Yard' ? '#4338ca' : '#0e7490'
                                                }}
                                            >
                                                <option>On Ship</option>
                                                <option>In Yard</option>
                                                <option>In Transit</option>
                                                <option>Cleared</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn-icon danger"
                                                onClick={() => void handleDelete(c.id)}
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

            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3><Plus size={16} /> Add Cargo</h3>
                            <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Cargo Number *</label>
                                        <input value={number} onChange={e => setNumber(e.target.value)} placeholder="e.g. MSKU-4821376" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Size Type</label>
                                        <select value={sizeType} onChange={e => setSizeType(e.target.value)}>
                                            <option>20ft</option>
                                            <option>40ft</option>
                                            <option>40ft HC</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Weight (tons)</label>
                                        <input type="number" step="0.1" min="0" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 24.5" />
                                    </div>
                                    <div className="form-group">
                                        <label>Cargo Type</label>
                                        <input value={cargoType} onChange={e => setCargoType(e.target.value)} placeholder="e.g. Electronics" />
                                    </div>
                                    <div className="form-group">
                                        <label>Ship Name</label>
                                        <input value={shipName} onChange={e => setShipName(e.target.value)} placeholder="e.g. MV Ocean Star" />
                                    </div>
                                    <div className="form-group">
                                        <label>Current Location</label>
                                        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Yard A-12" />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-foot">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>Add Cargo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

