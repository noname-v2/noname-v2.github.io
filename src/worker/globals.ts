import type { Accessor } from './accessor';
import type { Game } from './game';
import type { Worker } from './worker';


/** Internal context. */
export const globals = {} as {
    game: Game;
    worker: Worker;
    accessor: Accessor;
};

////// debug
(globalThis as any).globals = globals;