import type { Task } from './game/task';
import type { Component, Color } from './components';
import type { accessExtension, getInfo} from './extension';
import type { lib } from './client/globals';

/** Plain dictionary object. */
export type Dict<T=any> = {[key: string]: T};

/** Creator of a subclass. */
export interface Class<T=any> {
    (cls: {new(...args: any[]): T}): {new(...args: any[]): T} | Dict<{new(...args: any[]): T}>;
};

/** Link class reference. */
export type { Link } from './worker/link';

/** Mode configuration entry. */
export interface Config {
    /** Display name. */
    name?: string;

    /** Text shown when clicked. */
    intro?: string;

    /** Initial value. */
    init: string | number | boolean;

    /** Possible values. */
    options?: [string | number, string][],

    /** Only shown if another config is enabled / disabled. */
    requires?: string;

    /** Requires confirmation when toggling. */
    confirm?: [string | number | boolean, [string | null, string?]][]
}

/** SGS hero definition. */
export interface HeroData {
    /** Hero name. */
    name: string;

    /** Hero intro. */
    intro: string;

    /** Hero gender. */
    gender: string;

    /** Hero faction. */
    faction: string;

    /** Maximum HP. */
    hp: number;

    /** Hero skills. */
    skills: string[];

    /** Section of the extension that contains the hero. */
    subpack?: string;

    [key: string]: any;
};

/** SGS card definition. */
export interface CardData {
    /** Card name. */
    name: string;

    /** Card intro. */
    intro: string;

    /** Card type. */
    type: string;

    /** Card subtype. */
    subtype?: string;

    /** Inherit from a base card. */
    inherit?: string;

    /** Skills when holding the card or when equipped. */
    skills?: string[];

    /** Decoration of the card name. */
    decoration?: string;

    /** Derivation of another card (also viewed as that card). */
    originated?: string;

    /** Bottom-left label. */
    label?: string;

    /** Caption text (if not equal to this.name). */
    caption?: string | [string, string];

    /** Section of the extension that contains the card. */
    subpack?: string;

    /** Range that the card can reach. */
    range?: number;

    /** Distance changes when equipped. */
    distance?: number | [number, number];

    [key: string]: any;
};

/** SGS skill definition. */
export interface SkillData {
    /** Skill name. */
    name: string;

    /** Skill intro. */
    intro: string;

    /** Skill type. */
    type?: string;
    
    /** Task when skill is used or triggered. */
    task?: Class<Task>;

    /** Inherit from a parent skill. */
    inherit?: string;

    /** Condition to trigger the skill. */
    trigger?: Dict<string>;

    [key: string]: any;
};

/** Mode information. */
export interface ModeData {
    /** Mode name. */
    name?: string;

    /** Mode intro. */
    intro?: string;

    /** Name of the extension that contains the mode. */
    extension?: string;

    /** Mode-specific task classes. */
    tasks?: Dict<Class<Task>>;

    /** Mode-specific component classes. */
    components?: Dict<(cls: any) => typeof Component>;

    /** Mode-specific general classes. */
    classes?: Dict<Class>;

    /** Configuration entries that are displayed in the lobby. */
    config?: Dict<Config>;

    /** Inherit from a parent mode. */
    inherit?: string;

    /** Number of players. */
    np?: number | number[];

    /** Minimum number of heros enabled. */
    minHeroCount?: number;

    /** Minimum number of cards in card pile. */
    minPileCount?: number;

    /** Generate keywords from sections. */
    autoKeywords?: Dict<Color>;

    [key: string]: any;
}

/** Format of card pile. */
export type Pile = Dict<Dict<(number | [number, ...string[]])[]>>;
export type PileEntries = [string, string, number, ...string[]][];

/** Basic extension structure. */
export interface Extension {
    /** Mode configuration. */
    mode?: ModeData;

    /** Hero data. */
    hero?: Dict<HeroData>;

    /** Card data. */
    card?: Dict<CardData>;

    /** Skill data. */
    skill?: Dict<SkillData>;

    /** Card pile. */
    pile?: Pile;

    /** Name of the heropack provided. */
    heropack?: string;

    /** Name of the cardpack provided. */
    cardpack?: string;

    /** Tags determining whether it can be used in a certain mode. */
    tags?: string[];

    /** Data that is collected from all extensions. */
    lib?: Partial<typeof lib>;

    /** Extension dependency. */
    requires?: string[];
}

/** Selection configurations. */
export interface Select<T extends string | number = string | number> {
    /** Components during selection. */
    create?: [string, ...any[]];

    /** Section to put selected items. */
    tag: string;

    /** Items to choose from. */
    items: T[];

    /** Selectable items created by this.filter(). */
    selectable?: T[];

    /** Task ID and function name of the filter. */
    filter?: [number, string];

    /** Progress to a new Select when finished selection. */
    next?: [number, string, string];

    /** Required number of selected items. */
    num: number | [number, number];

    /** Additional data (e.g. mapping string to [name, suit, number] for vcard.) */
    [key: string]: any;
}

/** Selected items. */
export type Selected<T extends string | number = string | number> = Dict<T[]>;

/** <this> of filter functions. */
export interface FilterThis<T extends string | number = string | number> extends Select<T> {
    /** Player ID. */
    player?: number;

    /** Get hero / card / skill data. */
    getInfo: typeof getInfo;

    /** Get component properties. */
    getData: (id: number) => { readonly [key: string]: any };

    /** Get extension data. */
    accessExtension: typeof accessExtension;

    /** Selected items. */
    selected: Selected<T>;

    /** Selection configurations. */
    selects: Dict<Select<T>>;
}