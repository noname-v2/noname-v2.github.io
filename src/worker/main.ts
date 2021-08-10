import { Room } from './room';
import { Worker } from './worker';
import { globals } from './globals';

globals.worker = new Worker();
globals.room = new Room();
