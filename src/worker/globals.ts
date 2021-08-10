import type { Room } from './room';
import type { Game } from './game';
import type { Worker } from './worker';
import type { Link } from '../types';

/** Internal context. */
export const globals = {} as {
    room: Room;
    game: Game;
    worker: Worker;
    arena: Link;
};

////// debug
(globalThis as any).globals = globals;