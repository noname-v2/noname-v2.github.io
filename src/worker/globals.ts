import type { Accessor } from './accessor';
import type { Game } from './game';
import type { Worker } from './worker';
import type { Stage } from './stage';
import type { Task } from './task';
import type { Link, Dict } from '../types';

/** Internal context. */
export const globals = {} as {
    game: Game;
    worker: Worker;
    accessor: Accessor;
    arena: Link;
};

////// debug
(globalThis as any).globals = globals;