import type { Component, App, Arena, Splash } from '../components';
import type { create } from './ui';

/** Map of component constructors no extension loaded. */
export const backups = new Map<string, typeof Component>();

/** Map of component constructors. */
export const componentClasses = new Map<string, typeof Component>();

/** Restore original component constructors. */
export function restore() {
    componentClasses.clear();
    for (const [key, val] of backups.entries()) {
        componentClasses.set(key, val);
    }
}

/** Main components. */
export let app: App;
export let splash: Splash;
export let arena: Arena | null = null;

/** Create app and splash. */
export function init(c: typeof create) {
    app = c('app');
    splash = c('splash');
}

/** Set arena. */
export function setArena(a: typeof arena) {
    arena = a;
}