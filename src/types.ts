import type { Task } from './worker/task';
import type { Component, TextColor } from './components';
import type { accessExtension, getHero, getCard} from './extension';
import type { lib } from './client/globals';

/** Plain object. */
export type Dict<T=any> = {[key: string]: T};

/** Creator of a subclass. */
export interface Class<T=any> {
    (cls: {new(...args: any[]): T}): {new(...args: any[]): T} | Dict<{new(...args: any[]): T}>;
};

/** Mode configuration entry. */
export interface Config {
    name?: string;
    intro?: string;
    init: string | number | boolean;
    options?: [string | number, string][],
    requires?: string;
    confirm?: [string | number | boolean, [string | null, string?]][]
}

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
export interface SkillData<T extends Task = Task> {
    name: string;
    intro: string;
    type?: string;
    task?: Class<T>;
    inherit?: string;
    trigger?: Dict<string>;
    [key: string]: any;
};

/** Mode information. */
export interface ModeData<T extends Task = Task> {
    name?: string;
    intro?: string;
    extension?: string;
    tasks?: Dict<Class<T>>;
    components?: Dict<(cls: any) => typeof Component>;
    classes?: Dict<Class>;
    config?: Dict<Config>;
    inherit?: string;
    np?: number | number[];
    duration?: number;
    minHeroCount?: number;
    minPileCount?: number;
    autoKeywords?: Dict<TextColor>;
    [key: string]: any;
}

/** Format of card pile. */
export type Pile = Dict<Dict<(number | [number, ...string[]])[]>>;
export type PileEntries = [string, string, number, ...string[]][];

/** Basic extension structure. */
export interface Extension<T extends Task = Task> {
    mode?: ModeData<T>;
    hero?: Dict<HeroData>;
    card?: Dict<CardData>;
    skill?: Dict<SkillData<T>>;
    pile?: Pile;
    heropack?: string;
    cardpack?: string;
    tags?: string[];
    lib?: Partial<typeof lib>;
    requires?: string[];
}

/** Format of extension meta data. */
export interface ExtensionMeta {
	mode: string;
	pack: boolean;
	tags: string[];
	images: string[];
}

/** Selectable items. */
export interface Select<T> {
    /** Items to choose from. */
    items: T[];

    /** Name of the function that checks if item can be selected. */
    filter?: string;

    /** Required number of selected items. */
    num: number | [number, number];
}

/** <this> of filter functions. */
export interface FilterThis<T extends string | number> {
    getHero: typeof getHero;
    getCard: typeof getCard;
    accessExtension: typeof accessExtension;
    selected: T[];
    all: T[];
}