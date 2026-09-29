export type OperationStatus = 'Queued' | 'Running' | 'Completed' | 'Cancelled';
export type OperationPriority = 1 | 2 | 3;

export interface OperationRecord {
    id: number;
    operation_type: string;
    ship_name: string;
    berth_id: string;
    crane_id: string;
    priority: number;
    status: OperationStatus | string;
    turnaround_time_ms?: number;
    waiting_time_ms?: number;
    start_time?: string;
    end_time?: string;
    created_at?: string;
    created_by?: string;
}

export interface CreateOperationFormInput {
    operationType: string;
    shipName: string;
    craneId?: string;
    berthId?: string;
    priority?: number;
    burstDuration?: number;
}

export interface UpdateOperationStatusInput {
    status: OperationStatus | string;
}

export interface DispatchProcessResult {
    dispatched: number | null;
    message?: string;
    process?: {
        id: string;
        burstTime: number;
        waitingTime: number;
        turnaroundTime: number;
    };
}
