import type { Component, ComponentClass } from '../client/component';
import type { StageAccessor } from '../worker/stage-acc';

export interface Section {
    name?: string;
    intro?: string;
    content?: (this: StageAccessor, ...args: any[]) => any;
    contents?: {[key: string]: (this: StageAccessor, ...args: any[]) => any};
    [key: string]: any;
}

export interface Collection {
    [key: string]: Section | ((stage: StageAccessor) => any);
}

export interface Pile {
    [key: string]: {
        [key: string]: (number | [number, ...string[]])[];
    }
}

export interface Extension {
    mode?: Section;
    skill?: Collection;
    card?: Collection;
    hero?: Collection;
    ruleset?: {[key: string]: Collection};
    heropack?: string;
    cardpack?: string;
    tags?: string[];
    pile?: Pile;
    components?: (c: typeof Component, cs: Map<string, ComponentClass>) => void;
}