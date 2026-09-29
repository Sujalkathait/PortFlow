import { useEffect, useState } from 'react';
import {
    Trash2, RotateCcw, AlertCircle, CheckCircle2, RefreshCw, X
} from 'lucide-react';
import { api } from '../lib/api';

export function TrashPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            setItems(await api.trash.list());
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, []);

    const handleRestore = async (collection: string, id: number) => {
        setError('');
        setSuccess('');
        try {
            await api.trash.restore(collection, id);
            setSuccess('Record restored successfully from trash to active state.');
            void load();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handlePermanentDelete = async (collection: string, id: number) => {
        setError('');
        setSuccess('');
        if (!window.confirm('Permanently delete this record? This action cannot be undone.')) return;
        try {
            await api.trash.permanentDelete(collection, id);
            setSuccess('Record permanently deleted from database.');
            void load();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleEmptyTrash = async () => {
        setError('');
        setSuccess('');
        if (!window.confirm(`Permanently purge all ${items.length} records in trash? This cannot be undone.`)) return;
        try {
            const result = await api.trash.emptyAll();
            setSuccess(result.message);
            void load();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const getRecordLabel = (item: any) => {
        switch (item._collection) {
            case 'operations': return `OP-${item.id} — ${item.label || item.operation_type} (${item.ship_name})`;
            case 'ships': return `Ship: ${item.label || item.name} (${item.ship_name || item.imo_number})`;
            case 'Cargos': return `Cargo: ${item.label || item.Cargo_number} (${item.ship_name || item.cargo_type})`;
            case 'Equipments': return `Equipment: ${item.label || item.name} (${item.ship_name || item.type})`;
            default: return `Record #${item.id}`;
        }
    };

    const getCollectionBadge = (collection: string) => {
        const map: Record<string, { bg: string; color: string }> = {
            operations: { bg: '#dbeafe', color: '#1d4ed8' },
            ships: { bg: '#cffafe', color: '#0e7490' },
            Cargos: { bg: '#ffedd5', color: '#c2410c' },
            Equipments: { bg: '#e0e7ff', color: '#4338ca' },
        };
        const s = map[collection] || { bg: '#f1f5f9', color: '#475569' };
        return (
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '4px', background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {collection}
            </span>
        );
    };

    return (
        <div className="page-content">
            <div className="page-title-row">
                <div>
                    <p className="page-eyebrow">DATA RECOVERY & AUDIT</p>
                    <h1>Trash Bin</h1>
                    <p className="subtitle">Restore or permanently delete soft-deleted records from PostgreSQL</p>
                </div>
                <div className="panel-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => void load()} disabled={loading}>
                        <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                    {items.length > 0 && (
                        <button type="button" className="btn btn-danger" onClick={() => void handleEmptyTrash()}>
                            <Trash2 size={14} /> Empty Trash ({items.length})
                        </button>
                    )}
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
                    <h2><Trash2 size={16} /> Deleted Records</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{items.length} in trash</span>
                </div>
                {loading ? (
                    <div className="panel-body"><p style={{ color: 'var(--muted)' }}>Loading trash records from database...</p></div>
                ) : items.length === 0 ? (
                    <div className="panel-body">
                        <div className="empty-state">
                            <Trash2 />
                            <h3>No records found.</h3>
                            <p>The trash bin is empty. Soft-deleted records will appear here with one-click restore.</p>
                        </div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Record</th><th>Collection</th><th>Deleted At</th><th>Deleted By</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={`${item._collection}-${item.id}`}>
                                        <td>
                                            <strong>{getRecordLabel(item)}</strong>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                                                Created: {new Date(item.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td>{getCollectionBadge(item._collection)}</td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {item.deleted_at ? new Date(item.deleted_at).toLocaleString() : '—'}
                                        </td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                                            {item.deleted_by || '—'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => void handleRestore(item._collection, item.id)}
                                                    title="Restore to active location"
                                                >
                                                    <RotateCcw size={13} /> Restore
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => void handlePermanentDelete(item._collection, item.id)}
                                                    title="Permanently Delete"
                                                >
                                                    <X size={13} /> Delete Forever
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
        </div>
    );
}

