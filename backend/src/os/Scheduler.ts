import { Process } from './Process';

export interface SchedulingStrategy {
    schedule(processes: Process[]): Process | null;
}

export class FCFSStrategy implements SchedulingStrategy {
    schedule(processes: Process[]): Process | null {
        // Sort by arrival time
        return processes.sort((a, b) => a.arrivalTime - b.arrivalTime)[0] || null;
    }
}

export class SJFStrategy implements SchedulingStrategy {
    schedule(processes: Process[]): Process | null {
        // Sort by burst time
        return processes.sort((a, b) => a.burstTime - b.burstTime)[0] || null;
    }
}

export class Scheduler {
    private strategy: SchedulingStrategy;
    private readyQueue: Process[] = [];

    constructor(strategy: SchedulingStrategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy: SchedulingStrategy) {
        this.strategy = strategy;
    }

    addProcess(process: Process) {
        process.status = 'READY';
        this.readyQueue.push(process);
    }

    getNextProcess(): Process | null {
        if (this.readyQueue.length === 0) return null;
        const nextProcess = this.strategy.schedule(this.readyQueue);
        if (nextProcess) {
            this.readyQueue = this.readyQueue.filter(p => p.id !== nextProcess.id);
            return nextProcess;
        }
        return null;
    }

    removeProcess(processId: string) {
        this.readyQueue = this.readyQueue.filter(p => p.id !== processId);
    }

    getReadyQueue() {
        return this.readyQueue;
    }
}
