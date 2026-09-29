export type OperationStatus = 'Queued' | 'Running' | 'Completed' | 'Cancelled';
export type OperationType = 'Cargo Loading' | 'Cargo Discharge' | 'Berthing' | 'Maintenance' | string;

export interface OperationRecord {
    id: number;
    processId: string;
    process_id?: string;
    operation_type: OperationType;
    ship_name: string;
    crane_id: string;
    berth_id: string;
    priority: number;
    status: OperationStatus;
    start_time: string | null;
    end_time: string | null;
    waiting_time_ms: number | null;
    turnaround_time_ms: number | null;
    created_by: string;
    created_at: string;
    deleted_at: string | null;
    deleted_by: string | null;
}

export interface CreateOperationDTO {
    operationType: string;
    shipName: string;
    craneId?: string;
    berthId?: string;
    priority?: number;
    burstDuration?: number;
    created_by: string;
}

export interface UpdateOperationDTO {
    status?: OperationStatus;
    crane_id?: string;
    berth_id?: string;
    priority?: number;
    start_time?: string | null;
    end_time?: string | null;
    waiting_time_ms?: number | null;
    turnaround_time_ms?: number | null;
}

export interface OperationMetricsDTO {
    total: number;
    queued: number;
    running: number;
    completed: number;
    cancelled: number;
    uniqueShips: number;
    avgTurnaroundMs: number;
    avgWaitingMs: number;
}
