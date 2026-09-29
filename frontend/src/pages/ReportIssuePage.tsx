import { useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
            setError(e.message || 'Failed to submit issue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Operator Support</p>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Report Incident / Technical Issue</h1>
                <p className="text-sm text-muted-foreground">Submit operational anomalies, crane equipment faults, or vessel conflicts for administrative review</p>
            </div>

            {/* Notification Alerts */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" /> Incident Report Form
                    </CardTitle>
                    <CardDescription>
                        Details submitted here are dispatched into the system audit log and alerted to administrators.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Issue Title *</label>
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Crane B mechanical failure during discharge"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Detailed Description *</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Provide specific vessel name, berth location, timestamps, and error codes observed..."
                                required
                                rows={6}
                                className="w-full rounded-md border border-input bg-background p-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            <Send className="mr-2 h-4 w-4" />
                            {loading ? 'Submitting...' : 'Dispatch Issue Report'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
