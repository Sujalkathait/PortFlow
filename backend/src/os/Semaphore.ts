import { Process } from './Process';

export class Semaphore {
    private count: number;
    private maxCount: number;
    private waitingQueue: Process[] = [];

    constructor(initialCount: number) {
        this.count = initialCount;
        this.maxCount = initialCount;
    }

    async acquire(process: Process): Promise<void> {
        return new Promise((resolve) => {
            if (this.count > 0) {
                this.count--;
                resolve();
            } else {
                process.status = 'WAITING';
                this.waitingQueue.push(process);
                // The process will be resolved later when release is called
                // Wait, we need to store the resolve function
                (process as any)._semaphoreResolve = resolve;
            }
        });
    }

    release() {
        if (this.waitingQueue.length > 0) {
            const process = this.waitingQueue.shift();
            if (process && (process as any)._semaphoreResolve) {
                process.status = 'READY';
                (process as any)._semaphoreResolve();
                delete (process as any)._semaphoreResolve;
            }
        } else {
            if (this.count < this.maxCount) {
                this.count++;
            }
        }
    }

    getAvailable(): number {
        return this.count;
    }
}
