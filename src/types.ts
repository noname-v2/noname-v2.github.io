import type { lib } from './client/globals';
import type { Color } from './../build/literals';
import type { Task } from './tasks/task';
import type { Link, LinkData } from './links/link';

/** Export base types. */
export type { Task };
export type { Link, LinkData };
export type { Component } from './components/component';

/** Plain dictionary object. */
export type Dict<T=any> = {[key: string]: T};

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

    /** Mode-specific link classes. */
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

/** Format of card pile defined in extensions. */
export type Pile = Dict<Dict<(number | [number, ...string[]])[]>>;

/** Format of arena.pile. */
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

/** Link that can be selected. */
export interface SelectData extends LinkData {
    /** Configuration */
    select: ClientSelect | null;
}

/** Selection configurations for worker */
export interface Select {
    /** Task that created this selection
     * (may used by this.create, this.filter, this.progress, this.num).
     */
    task: Task;

    /** Link that control the selection of items (if not defined, this.create must exist). */
    target?: Link<SelectData>;

    /** Create link for this.bind when parsed (method name of this.task). */
    create?: string;

    /** Items available for selection. */
    items: (string | Link)[];

    /** Function that determines whether an item is selectable (method name of this.task). */
    filter?: string;

    /** Dynamically create this.next based on current selection (method name of this.task). */
    progress?: string;

    /** New selection to deal with after finishing current one. */
    next?: Select;

    /** Previons selection (this.next.previous === this). */
    previous?: Select;

    /** Min and max number of selected items, or function name that returns [min, max]. */
    num?: number | [number, number] | string;

    /** Must make choice (no cancel button). */
    forced: boolean;

    /** Custom properties. */
    [key: string]: any;
}

/** Selection configurations for client-side selectable component. */
export interface ClientSelect {
    /** Include a timer [duration, starttime]. */
    timer?: [number, number];

    /** Status of items of <type Link>.
     * 0: Item is selectable.
     * 1: Item is selected.
     * -1: Item is disabled.
     */
    links: {[key: string]: 0 | 1 | -1};

    /** Status of items of <type string>. */
    items: {[key: string]: 0 | 1 | -1};

    /** Must make choice (no cancel button). */
    forced?: boolean;

    /** Min and max number of selected items. */
    num: [number, number];

    /** Do not contact worker after each selection. */
    simple?: boolean;

    /** Selection currently disabled (progressed to the next level). */
    blurred?: boolean;
}
