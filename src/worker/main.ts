import { Game } from './game';
import { Worker } from './worker';
import { globals } from './globals';

globals.worker = new Worker();
globals.game = new Game();
