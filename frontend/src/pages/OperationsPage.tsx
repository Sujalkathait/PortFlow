import { useState } from 'react';
import { Plus, RefreshCw, AlertCircle, CheckCircle2, Anchor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    useOperations,
    OperationMetricsCards,
    OperationsTable,
    OperationCreateModal,
    OperationEditModal,
} from '@/features/operations';
import type { OperationRecord } from '@/features/operations';

/**
 * OperationsPage — Smart Container Component
 * Follows LLD architectural separation:
 * - State and asynchronous workflows are handled by the `useOperations` ViewModel hook.
 * - Rendering is delegated to reusable Presentational components.
 */
export function OperationsPage() {
    const {
        operations,
        loading,
        submitting,
        error,
        success,
        queuedCount,
        runningCount,
        completedCount,
        refresh,
        createOperation,
        updateStatus,
        deleteOperation,
        dispatchNextProcess,
    } = useOperations();

    const [showCreate, setShowCreate] = useState(false);
    const [editOp, setEditOp] = useState<OperationRecord | null>(null);

    const handleDelete = async (id: number) => {
        if (!window.confirm(`Move operation OP-${id} to Trash?`)) return;
        await deleteOperation(id);
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Port Operations & Scheduling
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Operations Management
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Create, monitor, and dispatch real-time port operations with custom crane/berth allocation
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button size="sm" onClick={() => setShowCreate(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Operation
                    </Button>
                </div>
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

            {/* Metrics & OS Dispatch Component */}
            <OperationMetricsCards
                queuedCount={queuedCount}
                runningCount={runningCount}
                completedCount={completedCount}
                onDispatch={() => void dispatchNextProcess()}
                disabled={loading}
            />

            {/* Operations Table Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Anchor className="h-4 w-4 text-primary" /> Active Port Operations
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                            {operations.length} total operations
                        </span>
                    </CardTitle>
                    <CardDescription>
                        Search by ship name, filter, or reorder table headers.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <OperationsTable
                        operations={operations}
                        loading={loading}
                        onUpdateStatus={(id, status) => void updateStatus(id, status)}
                        onEdit={op => setEditOp(op)}
                        onDelete={id => void handleDelete(id)}
                    />
                </CardContent>
            </Card>

            {/* Modals */}
            <OperationCreateModal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                onSubmit={createOperation}
                submitting={submitting}
            />

            <OperationEditModal
                operation={editOp}
                onClose={() => setEditOp(null)}
                onUpdateStatus={(id, status) => void updateStatus(id, status)}
            />
        </div>
    );
}
