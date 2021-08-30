import type { Task } from './worker/task';
import type { Component } from './components';
import type { accessExtension, getHero, getCard} from './extension';

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

/** Mode information. */
export interface Mode<T extends Task = Task> {
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
    [key: string]: any;
}

/** Basic extension structure. */
export interface Extension<T extends Task = Task> {
    mode?: Mode<T>;
    hero?: Dict;
    card?: Dict;
    skill?: Dict;
    heropack?: string;
    cardpack?: string;
    tags?: string[];
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