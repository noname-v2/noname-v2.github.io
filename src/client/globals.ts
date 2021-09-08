import type { Component, App, Arena, Splash, Color } from '../components';
import type { Dict } from '../types';
import { debug } from '../meta';

/** Map of component constructors no extension loaded. */
export const backups = new Map<string, typeof Component>();

/** Map of component constructors. */
export const componentClasses = new Map<string, typeof Component>();

/** Restore original component constructors. */
export function restore() {
    componentClasses.clear();
    for (const [tag, cls] of backups) {
        componentClasses.set(tag, cls);
    }
}

/** Main components. */
export let app: App;
export let splash: Splash;
export let arena: Arena | null = null;

/** Extention items that are indexed. */
export const lib = {
    /** Keywords in intro. */
    keyword: {} as Dict<[string, Color?, string?]>,

    /** factions from extensions. */
    faction: {} as Dict<[string, Color]>,

    /** Card types from extensions. */
    type: {} as Dict<string>,

    /** Card subtypes from extensions. */
    subtype: {} as Dict<string>,

    /** Card labels.
     * [0]: display text
     * [1]: color
     * [2]: full name
     * [3]: intro
     */
    label: {} as Dict<[string, (string | null)?, string?, string?]>,

	/** Card suit, color and number text. */
	suit: {heart: '♥︎', diamond: '♦︎', club: '♣︎', spade: '♠︎'} as Dict<string>,

    /** Card color. */
	color: {heart: 'red', diamond: 'red', club: 'black', spade: 'black'} as Dict<string>,

    /** Card number */
	number: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
};

/** Set the value of main components. */
export function set(target: 'app' | 'splash' | 'arena', val: any) {
    switch (target) {
        case 'app': app = val; break;
        case 'splash': splash = val; break;
        case 'arena': arena = val; break;
    }

    if (debug) {
        (window as any)[target] = val;
    }
}