import type { Extension, Class } from '../../worker/extension';
import type { Dict } from '../../utils';
import type { task } from './core/task';
import type { game } from './core/game';

/** Built-in types that may be used by extensions. */
export type { Link } from '../../worker/link';
export type { Config } from '../../worker/extension';
export type { Dict }

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