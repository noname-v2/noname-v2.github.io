import type { Component, App, Arena, Splash, GlowColor, TextColor } from '../components';
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
    keyword: {} as Dict<[string, TextColor]>,

    /** factions from extensions. */
    faction: {} as Dict<[string, GlowColor]>,

    /** Card types from extensions. */
    type: {} as Dict<string>,

    /** Card subtypes from extensions. */
    subtype: {} as Dict<string>
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