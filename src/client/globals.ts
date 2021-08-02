import type { Client } from './client';
import type { UI } from './ui';
import type { Database } from './database';
import type { ComponentClass, Component, App, Arena, Splash } from '../components';
import type { Accessor } from './accessor';

/** Components synced with the worker. */
const components = new Map<number, Component>();

/** Event listeners. */
const listeners = Object.freeze({
    // connection status change
    sync: new Set<{sync: () => void}>(),
    // document resize
    resize: new Set<{resize: () => void}>(),
    // keyboard event
    key: new Set<{key: (e: KeyboardEvent) => void}>(),
    // stage change
    stage: new Set<{key: () => void}>()
});

/** Internal context. */
export const globals = { components, listeners } as {
    accessor: Accessor;
    client: Client;
    ui: UI;
    db: Database;
    app: App;
    splash: Splash;
    arena?: Arena;
    listeners: typeof listeners;
    components: typeof components;
    componentClasses: Map<string, ComponentClass>;
};

////// debug
(globalThis as any).globals = globals;