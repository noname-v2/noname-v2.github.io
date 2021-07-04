import type { StageAccessor } from '../worker/stage-acc';


export interface Section {
    name?: string;
    intro?: string;
    content?: (this: StageAccessor, ...args: any[]) => any;
    contents?: {[key: string]: (this: StageAccessor, ...args: any[]) => any};
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
}