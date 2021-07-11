import type { Component, ComponentClass } from '../client/component';
import type { StageAccessor } from '../worker/stage-acc';

export interface Section {
    name?: string;
    intro?: string;
    content?: (this: StageAccessor, ...args: any[]) => any;
    contents?: {[key: string]: (this: StageAccessor, ...args: any[]) => any};
    [key: string]: any;
}

export interface RuleSet {
    game: {
        loop: Section;
        [key: string]: any;
    };
    stage: {
        before: Section;
        main: Section;
        after: Section;
        [key: string]: any;
    };
    config: {
        [key: string]: {
            name: string;
            intro?: string;
            init: any;
            options?: [string | number, any][];
            confirm?: any[];
        };
    };
    [key: string]: any;
}

export interface Extension {
    mode?: Section;
    skill?: {[key: string]: Section};
    card?: {[key: string]: Section};
    hero?: {[key: string]: Section};
    ruleset?: {[key: string]: any};
    heropack?: string;
    cardpack?: string;
    tags?: string[];
    components?: (c: typeof Component, cs: Map<string, ComponentClass>) => void;
}