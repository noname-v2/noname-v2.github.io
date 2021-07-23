import type { Component, ComponentClass } from '../client/component';
import type { Stage } from '../worker/stage';

export interface Section {
    name?: string;
    intro?: string;
    content?: (this: Stage, ...args: any[]) => any;
    contents?: {[key: string]: (this: Stage, ...args: any[]) => any};
    [key: string]: any;
}

export interface Collection<T extends Section = Section> {
    [key: string]: T | ((stage: Stage) => any);
}

export interface Extension {
    mode?: Section;
    skill?: Collection;
    card?: Collection;
    hero?: Collection;
    ruleset?: {[key: string]: Collection};
    inherit?: string;
    heropack?: string;
    cardpack?: string;
    tags?: string[];
    components?: (c: typeof Component, cs: Map<string, ComponentClass>) => void;
}