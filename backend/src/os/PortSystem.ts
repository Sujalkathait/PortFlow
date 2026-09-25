import { Process } from './Process';
import { Scheduler, FCFSStrategy } from './Scheduler';
import { Mutex } from './Mutex';
import { Semaphore } from './Semaphore';
import { DeadlockDetector } from './DeadlockDetector';

export class PortSystem {
    private static instance: PortSystem;
    private scheduler: Scheduler;
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

        // Try to acquire locks
        const locksToAcquire = process.requiredResources;
        for (const res of locksToAcquire) {
            if (this.mutexes.has(res)) {
                await this.mutexes.get(res)!.lock(process);
                process.heldResources.push(res);
            }
        }

        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, process.burstTime));

        // Release locks
        for (const res of process.heldResources) {
            if (this.mutexes.has(res)) {
                this.mutexes.get(res)!.unlock(process);
            }
        }
        process.heldResources = [];

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
        const resourceLocks: Record<string, string> = {};
        for (const [res, mutex] of this.mutexes.entries()) {
            const owner = mutex.getOwner();
            if (owner) {
                resourceLocks[res] = owner.id;
            }
        }
        return DeadlockDetector.detectDeadlock(Array.from(this.processes.values()), resourceLocks);
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
