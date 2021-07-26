import type { Component } from '../client/component';
import type { Stage } from './stage';
import type { Task } from './task';
import type { Dict } from '../utils';

/** Creates a subclass of Task. */
export type TaskCreator = (cls: typeof Task) => typeof Task;

/** Creates a subclass of Componenbt. */
export type ComponentCreator = (cls: typeof Component) => typeof Component;

/** Definitions for heros, cards, skills, etc. */
export interface Section {
    name?: string;
    intro?: string;
    task?: TaskCreator;
    inherit?: string;
    [key: string]: any;
}

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
export interface Mode {
    name?: string;
    intro?: string;
    tasks?: Dict<TaskCreator>;
    components?: Dict<ComponentCreator>;
    config?: Dict<Config>;
    inherit?: string;
    np?: number | number[];
    [key: string]: any;
}

/** Basic extension structure. */
export interface Extension {
    mode?: Mode;
    hero?: Dict<Section>;
    card?: Dict<Section>;
    skill?: Dict<Section>;
    heropack?: string;
    cardpack?: string;
    tags?: string[];
}