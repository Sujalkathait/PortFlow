import { Process } from '../Process';
import {
    Scheduler,
    FCFSStrategy,
    SJFStrategy,
    PriorityStrategy,
    RoundRobinStrategy
} from '../Scheduler';

describe('Scheduler & CPU Scheduling Algorithms', () => {
    test('FCFSStrategy should schedule process with earliest arrival time', () => {
        const strategy = new FCFSStrategy();
        const p1 = new Process('p1', 5000, [], 1);
        p1.arrivalTime = 200;
        const p2 = new Process('p2', 2000, [], 5);
        p2.arrivalTime = 100;
        const p3 = new Process('p3', 1000, [], 10);
        p3.arrivalTime = 300;

        const scheduled = strategy.schedule([p1, p2, p3]);
        expect(scheduled).toBe(p2);
        expect(scheduled?.id).toBe('p2');
    });

    test('SJFStrategy should schedule process with shortest burst time', () => {
        const strategy = new SJFStrategy();
        const p1 = new Process('p1', 5000, [], 1);
        const p2 = new Process('p2', 1500, [], 2);
        const p3 = new Process('p3', 3000, [], 3);

        const scheduled = strategy.schedule([p1, p2, p3]);
        expect(scheduled).toBe(p2);
        expect(scheduled?.burstTime).toBe(1500);
    });

    test('PriorityStrategy should schedule process with highest priority number', () => {
        const strategy = new PriorityStrategy();
        const p1 = new Process('p1', 2000, [], 3);
        const p2 = new Process('p2', 2000, [], 10);
        const p3 = new Process('p3', 2000, [], 5);

        const scheduled = strategy.schedule([p1, p2, p3]);
        expect(scheduled).toBe(p2);
        expect(scheduled?.priority).toBe(10);
    });

    test('RoundRobinStrategy should pick head of ready queue with configured quantum', () => {
        const strategy = new RoundRobinStrategy(1500);
        expect(strategy.getQuantum()).toBe(1500);

        const p1 = new Process('p1', 4000);
        const p2 = new Process('p2', 3000);

        const scheduled = strategy.schedule([p1, p2]);
        expect(scheduled).toBe(p1);
    });

    test('Scheduler should manage queue lifecycle and support runtime strategy switching', () => {
        const scheduler = new Scheduler(new FCFSStrategy());
        const p1 = new Process('p1', 5000, [], 1);
        p1.arrivalTime = 300;
        const p2 = new Process('p2', 1000, [], 10);
        p2.arrivalTime = 400;

        scheduler.addProcess(p1);
        scheduler.addProcess(p2);

        expect(scheduler.getReadyQueue().length).toBe(2);

        // Under FCFS, p1 arrives first
        let next = scheduler.getNextProcess();
        expect(next?.id).toBe('p1');
        expect(scheduler.getReadyQueue().length).toBe(1);

        // Reset and switch strategy to SJF
        scheduler.addProcess(p1); // ready queue: [p2, p1]
        scheduler.setStrategy(new SJFStrategy());

        // Under SJF, p2 (burst 1000) should be scheduled before p1 (burst 5000)
        next = scheduler.getNextProcess();
        expect(next?.id).toBe('p2');
    });
});
