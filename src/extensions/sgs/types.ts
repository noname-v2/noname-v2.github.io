import type { Extension, Class, Dict } from '../../types';
import type { task } from './classes/task';
import type { game } from './classes/game';

/** Types for pop selection. */
export type { Select, PopConfirm, PopContent } from '../../components/arena/pop';

/** Built-in types that may be used by extensions. */
export type { Link } from '../../worker/link';
export type { Config } from '../../types';
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

/** SGS hero definition. */
export type HeroDict = Dict<{
    name: string;
    intro: string;
    gender: string;
    faction: string;
    hp: number;
    skills: string[];
    subpack?: string;
    [key: string]: any;
}>;

/** SGS card definition. */
export type CardDict = Dict<{
    name: string;
    intro: string;
    type: string;
    task?: Class<Task>;
    inherit?: string;
    skills?: string[];
    subtype?: string;
    decoration?: string;
    originated?: string;
    label?: [string, string?];
    caption?: string;
    subpack?: string;
    range?: number;
    distance?: number | [number, number];
    [key: string]: any;
}>;

/** SGS skill definition. */
export type SkillDict = Dict<{
    name: string;
    intro: string;
    type?: string;
    task?: Class<Task>;
    inherit?: string;
    trigger?: Dict<string>;
    [key: string]: any;
}>;

/** Card pile format. */
export type Pile = Dict<Dict<(number | [number, ...string[]])[]>>;

/** Basic SGS extension structure. */
export interface SGS extends Extension<Task> {
    hero?: HeroDict;
    card?: CardDict;
    skill?: SkillDict;
    pile?: Pile;
}