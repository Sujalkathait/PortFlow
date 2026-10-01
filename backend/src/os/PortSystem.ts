import { Process } from './Process';
import { Scheduler, FCFSStrategy, SJFStrategy, PriorityStrategy } from './Scheduler';
import { Mutex } from './Mutex';
import { Semaphore } from './Semaphore';
import { DeadlockDetector } from './DeadlockDetector';

export type SchedulingAlgo = 'FCFS' | 'SJF' | 'PRIORITY';

export class PortSystem {
    private static instance: PortSystem;
    private scheduler: Scheduler;
    private currentAlgo: SchedulingAlgo = 'FCFS';
    private processes: Map<string, Process> = new Map();
    private mutexes: Map<string, Mutex> = new Map(); // E.g., cranes
    private semaphores: Map<string, Semaphore> = new Map(); // E.g., berths
    
    // For monitoring
    private executedProcesses: Process[] = [];

    private constructor() {
        this.scheduler = new Scheduler(new FCFSStrategy());
    }

    public static getInstance(): PortSystem {
        if (!PortSystem.instance) {
            PortSystem.instance = new PortSystem();
        }
        return PortSystem.instance;
    }

    public setSchedulingAlgorithm(algo: SchedulingAlgo) {
        this.currentAlgo = algo;
        if (algo === 'FCFS') this.scheduler.setStrategy(new FCFSStrategy());
        else if (algo === 'SJF') this.scheduler.setStrategy(new SJFStrategy());
        else if (algo === 'PRIORITY') this.scheduler.setStrategy(new PriorityStrategy());
    }

    public registerCrane(craneId: string) {
        if (!this.mutexes.has(craneId)) {
            this.mutexes.set(craneId, new Mutex());
        }
    }

    public registerBerths(semaphoreId: string, count: number) {
        if (!this.semaphores.has(semaphoreId)) {
            this.semaphores.set(semaphoreId, new Semaphore(count));
        }
    }

    public addProcess(process: Process) {
        this.processes.set(process.id, process);
        this.scheduler.addProcess(process);
    }

    public async executeNextProcess() {
        const process = this.scheduler.getNextProcess();
        if (!process) return null;

        process.start();

        // Try to acquire locks in a consistent globally sorted order to prevent deadlocks
        const locksToAcquire = [...process.requiredEquipments].sort();
        for (const res of locksToAcquire) {
            if (this.mutexes.has(res)) {
                await this.mutexes.get(res)!.lock(process);
                process.heldEquipments.push(res);
            }
        }

        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, process.burstTime));

        // Release locks
        for (const res of process.heldEquipments) {
            if (this.mutexes.has(res)) {
                this.mutexes.get(res)!.unlock(process);
            }
        }
        process.heldEquipments = [];

        process.finish();
        this.executedProcesses.push(process);
        this.processes.delete(process.id);

        return process;
    }

    public removeProcess(processId: string) {
        this.processes.delete(processId);
        this.scheduler.removeProcess(processId);
    }

    public checkDeadlock(): boolean {
        const EquipmentLocks: Record<string, string> = {};
        for (const [res, mutex] of this.mutexes.entries()) {
            const owner = mutex.getOwner();
            if (owner) {
                EquipmentLocks[res] = owner.id;
            }
        }
        return DeadlockDetector.detectDeadlock(Array.from(this.processes.values()), EquipmentLocks);
    }

    public getSystemState() {
        const mutexStates: Record<string, { isLocked: boolean; ownerId: string | null }> = {};
        for (const [res, mutex] of this.mutexes.entries()) {
            mutexStates[res] = {
                isLocked: mutex.isBusy(),
                ownerId: mutex.getOwner()?.id || null
            };
        }

        const semaphoreStates: Record<string, { available: number }> = {};
        for (const [res, sem] of this.semaphores.entries()) {
            semaphoreStates[res] = {
                available: sem.getAvailable()
            };
        }

        return {
            schedulingAlgorithm: this.currentAlgo,
            readyQueue: this.scheduler.getReadyQueue().map(p => ({
                id: p.id,
                status: p.status,
                priority: p.priority,
                burstTime: p.burstTime,
                waitingTime: Date.now() - p.arrivalTime
            })),
            executedCount: this.executedProcesses.length,
            deadlockDetected: this.checkDeadlock(),
            mutexes: mutexStates,
            semaphores: semaphoreStates
        };
    }
}

