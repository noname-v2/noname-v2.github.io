import type { Room } from './room';
import type { Game } from './game';
import type { Worker } from './worker';

/** Internal context. */
export const globals = {} as {
    room: Room;
    game: Game;
    worker: Worker;
};

////// debug
(globalThis as any).globals = globals;