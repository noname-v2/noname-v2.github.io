import type { Extension, TaskCreator } from '../../worker/extension';
import type { Dict } from '../../utils';

export type { Config } from '../../worker/extension';
export type { Link } from '../../worker/link';
export type { Task } from '../../worker/task';
export type { Dict } from '../../utils';

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
    task?: TaskCreator;
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
    type: string;
    task?: TaskCreator;
    trigger?: Dict<string>;
    [key: string]: any;
}>;

/** Card pile format. */
export type Pile = Dict<Dict<(number | [number, ...string[]])[]>>;

/** Basic SGS extension structure. */
export interface SGS extends Extension {
    hero?: HeroDict;
    card?: CardDict;
    skill?: SkillDict;
    pile?: Pile;
}