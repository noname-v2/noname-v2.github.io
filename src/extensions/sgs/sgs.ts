import type { Extension, Section } from '../../worker/extension';
import type { Dict } from '../../utils';

export type { Config } from '../../worker/extension';
export type { Link } from '../../worker/link';
export type { Task } from '../../worker/task';
export type { Dict } from '../../utils';

/** SGS hero definition. */
interface HeroSection extends Section {
    gender: string;
    faction: string;
    hp: number;
    skills: string[];
    subpack?: string;
}


/** SGS card definition. */
interface CardSection extends Section {
    type: string;
    subtype?: string;
    decoration?: string;
    originated?: string;
    label?: [string, string?];
    caption?: string;
    subpack?: string;
    range?: number;
    distance?: number | [number, number];
}

/** SGS skill definition. */
interface SkillSection extends Section {
    trigger?: Dict<string>;
}

/** Type shortcuts. */
export type HeroCollection = Dict<HeroSection>;
export type CardCollection = Dict<CardSection>;
export type SkillCollection = Dict<SkillSection>;
export type Pile = Dict<Dict<(number | [number, ...string[]])[]>>;

/** Basic SGS extension structure. */
export interface SGS extends Extension {
    hero?: HeroCollection;
    card?: CardCollection;
    skill?: SkillCollection;
    pile?: Pile;
}