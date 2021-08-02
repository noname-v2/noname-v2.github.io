import type { Accessor } from './accessor';
import type { Game } from './game';
import type { Worker } from './worker';
import type { Stage } from './stage';
import type { Task } from './task';
import type { Link, Dict } from '../types';

/** Accessor of Stage used by Task. */
const taskStage = new Map<Task, Stage>();

/** Links to components. */
const links = new Map<number, [Link, Dict]>();

/** Internal context. */
export const globals = { taskStage, links } as {
    game: Game;
    worker: Worker;
    accessor: Accessor;
    taskStage: typeof taskStage;
    links: typeof links;
    arena: Link;
};

////// debug
(globalThis as any).globals = globals;