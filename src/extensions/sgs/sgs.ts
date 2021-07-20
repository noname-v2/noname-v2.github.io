import type { Extension, Collection, Section } from '../../worker/extension';
export type { Collection } from '../../worker/extension';

interface HeroSection extends Section {
    gender: string;
    faction: string;
    hp: number;
    skills: string[];
    subpack?: string;
}

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

interface SkillSection extends Section {
    trigger?: {[key: string]: string};
}

export interface HeroCollection extends Collection<HeroSection> {}

export interface CardCollection extends Collection<CardSection> {}

export interface SkillCollection extends Collection<SkillSection> {}

export interface Pile {
    [key: string]: {
        [key: string]: (number | [number, ...string[]])[];
    }
}

export interface SGS extends Extension {
    hero?: HeroCollection;
    card?: CardCollection;
    skill?: SkillCollection;
    pile?: Pile;
}