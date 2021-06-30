import { Worker } from './worker';

const worker = new Worker();
(globalThis as any).worker = worker;
