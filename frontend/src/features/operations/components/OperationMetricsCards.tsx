import { Play, Activity, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OperationMetricsCardsProps {
    queuedCount: number;
    runningCount: number;
    completedCount: number;
    onDispatch: () => void;
    disabled?: boolean;
    isAdmin?: boolean;
}

export function OperationMetricsCards({
    queuedCount,
    runningCount,
    completedCount,
    onDispatch,
    disabled = false,
    isAdmin = true,
}: OperationMetricsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Quick Dispatch Card */}
            <Card className="md:col-span-2 bg-gradient-to-r from-card to-muted/20 border shadow-sm">
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Play className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="font-semibold text-sm">OS Dispatch Queue</div>
                            <div className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">{queuedCount}</span> operations currently waiting in ready queue
                            </div>
                        </div>
                    </div>
                    {isAdmin ? (
                        <Button
                            size="sm"
                            disabled={queuedCount === 0 || disabled}
                            onClick={onDispatch}
                            className="bg-primary text-primary-foreground shadow"
                        >
                            <Play className="mr-2 h-3.5 w-3.5" /> Dispatch Next Process
                        </Button>
                    ) : (
                        <span className="px-2.5 py-1 text-xs font-medium rounded bg-muted text-muted-foreground border">
                            Auto Scheduler Active
                        </span>
                    )}
                </CardContent>
            </Card>

            {/* Active Running Count */}
            <Card className="border shadow-sm">
                <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                        <Activity className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">Running Jobs</div>
                        <div className="text-xl font-bold text-foreground">{runningCount}</div>
                    </div>
                </CardContent>
            </Card>

            {/* Completed Count */}
            <Card className="border shadow-sm">
                <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                        <div className="text-xl font-bold text-foreground">{completedCount}</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
