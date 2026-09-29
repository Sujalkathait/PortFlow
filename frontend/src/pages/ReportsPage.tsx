import { useEffect, useState } from 'react';
import { Database, RefreshCw, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

export function ReportsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('portflow_auth_token');
            const res = await fetch(`${API_BASE_URL}/system/reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch Reports');
            const data = await res.json();
            setStats(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, []);

    return (
        <div className="page-content">
            <div className="page-title-row">
                <div>
                    <p className="page-eyebrow">ADMINISTRATION</p>
                    <h1>Database Analytics</h1>
                    <p className="subtitle">View table statistics and JOIN results</p>
                </div>
                <div className="panel-actions">
                    <button className="btn btn-secondary" onClick={() => void load()} disabled={loading}>
                        <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#b91c1c', fontSize: '0.88rem' }}>
                    <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />{error}
                </div>
            )}

            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                    <div className="panel">
                        <div className="panel-header">
                            <h2><Database size={16} /> Table Statistics ({stats.version})</h2>
                            <span className="badge green">{stats.dbStatus}</span>
                        </div>
                        <div className="panel-body">
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                <li><strong>Users Table:</strong> {stats.tableStats.users} rows</li>
                                <li><strong>Operations Table:</strong> {stats.tableStats.operations} rows</li>
                                <li><strong>Ships Table:</strong> {stats.tableStats.ships} rows</li>
                                <li><strong>Cargos Table:</strong> {stats.tableStats.Cargos} rows</li>
                            </ul>
                        </div>
                    </div>
                    <div className="panel">
                        <div className="panel-header">
                            <h2><Database size={16} /> JOIN Results</h2>
                        </div>
                        <div className="panel-body">
                            {stats.joinResults.map((j: any, i: number) => (
                                <div key={i} style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
                                    <code style={{ display: 'block', marginBottom: '0.5rem', color: '#0f172a' }}>{j.query}</code>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                                        Execution time: {j.timeMs}ms · Rows returned: {j.rows}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

