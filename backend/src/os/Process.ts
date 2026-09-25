export class Process {
    id: string;
    arrivalTime: number;
    burstTime: number;
    remainingTime: number;
    priority: number; // for SJF or priority scheduling
    status: 'NEW' | 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';
    
    // Stats
    startTime: number | null = null;
    endTime: number | null = null;
    waitingTime: number = 0;
    turnaroundTime: number = 0;

    // Operation specific
    operationId?: number;
    requiredResources: string[];
    heldResources: string[];

    constructor(id: string, burstTime: number, requiredResources: string[] = [], priority: number = 0) {
        this.id = id;
        this.arrivalTime = Date.now();
        this.burstTime = burstTime;
        this.remainingTime = burstTime;
        this.priority = priority;
        this.status = 'NEW';
        this.requiredResources = requiredResources;
        this.heldResources = [];
    }

    start() {
        if (!this.startTime) {
            this.startTime = Date.now();
            this.waitingTime = this.startTime - this.arrivalTime;
        }
        this.status = 'RUNNING';
    }

    finish() {
        this.status = 'TERMINATED';
        this.endTime = Date.now();
        this.turnaroundTime = this.endTime - this.arrivalTime;
    }
}
