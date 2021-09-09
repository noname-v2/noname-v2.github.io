import type { Extension, Dict, ModeData as M } from '../../types';
import type { task } from './classes/task';
import type { game } from './classes/game';

/** Types for pop selection. */
export type { PopConfirm, PopContent } from '../../components/arena/pop';

/** Built-in types that may be used by extensions. */
export * from '../../types';
export type { Dict }

/** Game classes */
export type { Player } from './classes/player';
export type { Card } from './classes/card';
export type { Skill } from './classes/skill';

/** Type for SGS Game. */
export type GameClass = ReturnType<typeof game>;
export type Game = InstanceType<GameClass>;

/** Type for SGS Task. */
export type TaskClass = ReturnType<typeof task>;
export type Task = InstanceType<TaskClass>;
export type ModeData = M<Task>;
export type SGS = Extension<Task>;