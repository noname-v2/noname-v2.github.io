import type { Extension, Class, Dict, Mode as BaseMode } from '../../types';
import type { task } from './classes/task';
import type { game } from './classes/game';

/** Types for pop selection. */
export type { PopConfirm, PopContent } from '../../components/arena/pop';

/** Built-in types that may be used by extensions. */
export type { Link } from '../../worker/link';
export type { Config, Select, Pile, FilterThis } from '../../types';
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
export type Mode = BaseMode<Task>;

/** SGS hero definition. */
export interface HeroData {
    name: string;
    intro: string;
    gender: string;
    faction: string;
    hp: number;
    skills: string[];
    subpack?: string;
    [key: string]: any;
};

/** SGS card definition. */
export interface CardData {
    name: string;
    intro: string;
    type: string;
    task?: Class<Task>;
    inherit?: string;
    skills?: string[];
    subtype?: string;
    decoration?: string;
    originated?: string;
    label?: string;
    caption?: string | [string, string];
    subpack?: string;
    range?: number;
    distance?: number | [number, number];
    [key: string]: any;
};

/** SGS skill definition. */
export interface SkillData {
    name: string;
    intro: string;
    type?: string;
    task?: Class<Task>;
    inherit?: string;
    trigger?: Dict<string>;
    [key: string]: any;
};

/** Basic SGS extension structure. */
export interface SGS extends Extension<Task> {
    hero?: Dict<HeroData>;
    card?: Dict<CardData>;
    skill?: Dict<SkillData>;
}