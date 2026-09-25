import { Process } from './Process';

export class Mutex {
    private isLocked: boolean = false;
    private owner: Process | null = null;
    private waitingQueue: Process[] = [];

    async lock(process: Process): Promise<void> {
        return new Promise((resolve) => {
            if (!this.isLocked) {
                this.isLocked = true;
                this.owner = process;
                resolve();
            } else {
                process.status = 'WAITING';
                this.waitingQueue.push(process);
                (process as any)._mutexResolve = resolve;
            }
        });
    }

    unlock(process: Process) {
        if (this.owner && this.owner.id === process.id) {
            if (this.waitingQueue.length > 0) {
                const nextProcess = this.waitingQueue.shift();
                if (nextProcess && (nextProcess as any)._mutexResolve) {
                    this.owner = nextProcess;
                    nextProcess.status = 'READY';
                    (nextProcess as any)._mutexResolve();
                    delete (nextProcess as any)._mutexResolve;
                }
            } else {
                this.isLocked = false;
                this.owner = null;
            }
        }
    }

    isBusy(): boolean {
        return this.isLocked;
    }

    getOwner(): Process | null {
        return this.owner;
    }
}
