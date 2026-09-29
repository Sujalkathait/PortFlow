import { useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

export function ReportIssuePage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const token = localStorage.getItem('portflow_auth_token');
            const res = await fetch(`${API_BASE_URL}/system/report-issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, description })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to submit issue');
            
            setSuccess(data.message);
            setTitle('');
            setDescription('');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="page-title-row">
                <div>
                    <p className="page-eyebrow">SUPPORT</p>
                    <h1>Report Issue</h1>
                    <p className="subtitle">Submit operational issues for administrative review</p>
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
                    <h2><AlertTriangle size={16} /> Issue Details</h2>
                </div>
                <div className="panel-body">
                    <form onSubmit={handleSubmit} className="form-grid">
                        <div className="form-group full">
                            <label>Issue Title *</label>
                            <input 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                placeholder="e.g. Crane B is malfunctioning" 
                                required 
                            />
                        </div>
                        <div className="form-group full">
                            <label>Description *</label>
                            <textarea 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                placeholder="Please provide details about the issue..." 
                                required 
                                rows={5}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px' }}
                            />
                        </div>
                        <div className="form-group full">
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                                <Send size={14} /> {loading ? 'Submitting...' : 'Submit Issue'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
