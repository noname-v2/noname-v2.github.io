import type { Task } from './tasks/task';
import type { Link } from './links/link';
import type { Component, Color, Pop } from './components/component';
import type { lib } from './client/globals';

/** Plain dictionary object. */
export type Dict<T=any> = {[key: string]: T};

/** Export default types. */
export type { Task }
export type { Link }
export type { Component }

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

/** General definition. */
interface Info {
    /** Display name. */
    name: string;

    /** Intro shown in context menu. */
    intro: string;

    /** Custom properties. */
    [key: string]: any;
}

/** Overwriting classes. */
export type Class<T> = (arg: { new(...args: any[]): T } ) => { new(...args: any[]): T};

/** Hero definition. */
export interface HeroInfo extends Info {
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
};

/** Card definition. */
export interface CardInfo extends Info {
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
};

/** Minion definition. */
export interface MinionInfo extends Info {
    /** Range that the minion can reach. */
    range?: number;
}

/** Skill definition. */
export interface SkillInfo extends Info {
    /** Skill type. */
    type?: string;
    
    /** Task when skill is used or triggered. */
    task?: (cls: unknown) => unknown;

    /** Inherit from a parent skill. */
    inherit?: string;

    /** Condition to trigger the skill. */
    trigger?: Dict<string>;

    [key: string]: any;
};

/** Mode information. */
export interface ModeInfo {
    /** Mode name. */
    name?: string;

    /** Mode intro. */
    intro?: string;

    /** Name of the extension that contains the mode. */
    extension?: string;

    /** Mode-specific task classes. */
    tasks?: Dict<(cls: unknown) => unknown>;

    /** Mode-specific general classes. */
    links?: Dict<(cls: unknown) => unknown>;

    /** Mode-specific component classes. */
    components?: Dict<(cls: unknown) => unknown>;

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
    mode?: ModeInfo;

    /** Hero data. */
    hero?: Dict<HeroInfo>;

    /** Card data. */
    card?: Dict<CardInfo>;

    /** Skill data. */
    skill?: Dict<SkillInfo>;

    /** Minion data. */
    minion?: Dict<MinionInfo>;

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
    /** Create a Pop component during selection (for client). */
    create?: [string, Pick<Pop, 'caption' | 'tray' | 'bar'>];

    /** Include a timer [duration, starttime] (for client). */
    timer?: [number, number];

    /** Items that are selectable. */
    items: T[];

    /** Selected items. */
    selected: T[];

    /** Task ID and function name of the filter (for worker). */
    filter?: [number, string];

    /** Items that are disabled because of this.filter (for client). */
    disabled?: T[];

    /** Dynamically create this.next based on current selection (for worker). */
    progress?: [number, string];

    /** New selection to deal with after finishing current one. */
    next?: Select;

    /** Required number of selected items. */
    num?: number | [number, number];

    /** Additional data. */
    [key: string]: any;
}
