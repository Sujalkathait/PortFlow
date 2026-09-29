import { useEffect, useState } from 'react';
import { ScrollText, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

export function LogsPage() {
    const [systemLogs, setSystemLogs] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('portflow_auth_token');
            const headers = {
                'Authorization': `Bearer ${token}`
            };
            const [sysRes, auditRes] = await Promise.all([
                fetch(`${API_BASE_URL}/system/logs`, { headers }),
                fetch(`${API_BASE_URL}/system/audit`, { headers })
            ]);
            
            if (!sysRes.ok || !auditRes.ok) throw new Error('Failed to fetch logs');
            
            const sys = await sysRes.json();
            const audit = await auditRes.json();
            
            setSystemLogs(sys);
            setAuditLogs(audit);
        } catch (e: any) {
            setError(e.message || 'Failed to load logs');
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
                    <h1>System & Audit Logs</h1>
                    <p className="subtitle">View system events and user actions</p>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="panel">
                    <div className="panel-header">
                        <h2><ScrollText size={16} /> System Logs</h2>
                    </div>
                    <div className="panel-body">
                        {loading ? <p>Loading...</p> : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {systemLogs.map(log => (
                                    <li key={log.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                            <span className={`badge ${log.level === 'WARN' ? 'orange' : 'blue'}`}>{log.level}</span>
                                            <strong>{log.source}:</strong> {log.message}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="panel">
                    <div className="panel-header">
                        <h2><ShieldCheck size={16} /> Audit Logs</h2>
                    </div>
                    <div className="panel-body">
                        {loading ? <p>Loading...</p> : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {auditLogs.map(log => (
                                    <li key={log.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                                        <div style={{ marginTop: '0.25rem' }}>
                                            <strong>{log.user}</strong>: <span style={{ color: 'var(--primary)' }}>{log.action}</span>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem' }}>{log.details}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
