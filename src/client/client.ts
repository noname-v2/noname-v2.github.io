import { importExtension, accessExtension } from '../extension';
import { rng } from '../utils';
import { create } from './ui';
import { backups, componentClasses, restore, app, splash, lib } from './globals';
import * as db from './db';
import * as meta from '../meta';
import type { Component, Color } from '../components';
import type { UITick, ClientMessage } from '../worker/worker';

/** Hub configuration. */
export const hub = new Proxy(meta.hub, {
    get(target, key: keyof typeof meta.hub) {
        return db.get(key) ?? target[key];
    }
});

/** Worker object. */
export let connection: Worker | WebSocket | null = null;

/** Types of component event listeners. */
export interface Listeners {
     // connection status change
     sync: {sync: () => void};

     // document resize
     resize: {resize: () => void};

     // keyboard event
     key: {key: (e: KeyboardEvent) => void};

     // stage change
     stage: {stage: () => void};
}

/** Event listeners. */
export const listeners = Object.freeze({
    sync: new Set(), resize: new Set(), key: new Set(), stage: new Set()
});

/** Service worker. */
export let registration: ServiceWorkerRegistration | null = null;
navigator.serviceWorker?.register('/service.js').then(reg => {
    registration = reg;
});

/** User identifier. */
export let uid: string;
db.ready.then(() => {
    if (!db.get('uid')) {
        db.set('uid', rng());
    }
    uid = db.get('uid');
});

/** Components managed by worker. */
export const components = new Map<number, Component>();

/** Map from a component to its ID. */
export const componentIDs = new Map<Component, number>();

/** ID of current stage. */
let stageID = 0;

/**  UITicks waiting for dispatch. */
let ticks: UITick[] = [];

/** Timestamp of the last full UI load. */
let loaded = 0;

/** This.#loop is not running. */
let paused = true;

/** Connect to a game server.
 * to worker: config[0]: mode name, config[1]: mode packs
 * to hub: config: hub url
 */
export function connect(config: [string, string[]] | string) {
    disconnect();

    if (Array.isArray(config)) {
        const worker = connection = new Worker(`dist/worker.js`, { type: 'module'});
        worker.onmessage = ({data}) => {
            if (data === 'ready') {
                worker.onmessage = ({data}) => dispatch(data);
                config.push([hub.nickname, hub.avatar]);
                send(0, config, true);
            }
        }
    }
    else {
        connection = new WebSocket(config);
    }
}

/** Disconnect from web worker. */
export function disconnect() {
    if (connection instanceof Worker) {
        connection.terminate();
    }
    else if (connection instanceof WebSocket) {
        connection.close();
    }
    if (connection) {
        connection = null;
        clear();
    }
}

/**
 * Send component return value to worker.
 * @param {number} id - ID of component (id > 0).
 * @param {any} result - Return value of component.
 * @param {boolean} done - true: component.respond(); false: component.yield()
 * Special ID:
 * 0: Initialize worker and create worker.#game.
 * -1: Reload due to UI error.
 * -2: Tell worker to disconnect from hub
 */
export function send(id: number, result: any, done: boolean) {
    const msg: ClientMessage = [uid, stageID, id, result, done];
    if (connection instanceof Worker) {
        connection.postMessage(msg)
    }
    else if (connection instanceof WebSocket) {
        connection.send('resp:' + JSON.stringify(msg));
    }
}

/** Add a UITick to render queue. */
export function dispatch(data: UITick) {
    ticks.push(data);
    if (paused) {
        loop();
    }
}

/** Clear currently connection status without disconnecting. */
export function clear(back: boolean = true) {
    // clear listeners
    for (const cmp of components.values()) {
        removeListeners(cmp);
    }

    // clear components
    components.clear();
    componentIDs.clear();

    // clear arena and popups
    app.clearPopups();
    app.arena?.remove();

    // restore original component classes
    restore();

    // back to splash screen
    if (back) {
        splash.show();
        stageID = 0;
    }
}

/** Trigger a listener. */
export function trigger(event: keyof Listeners, arg?: any) {
    for (const cmp of listeners[event]) {
        (cmp as any)[event](arg);
    }
} 

/** Load arena. */
async function loadArena(ruleset: string[], packs: string[]) {
    // fade out current arena
    const arena = app.arena;
    if (arena && app.popups.size) {
        arena.faded = true;
    }
    clear(false);
    loaded = Date.now();
    if (arena) {
        await app.sleep('fast');
    }

    // extension dependencies
    const allPacks = new Set<string>();
    const requires = new Set<string>();
    const autoKeywords = new Map<string, Color>();

    // overwrite component constructors by mode
    for (const pack of ruleset) {
        allPacks.add(pack);
        const ext = await importExtension(pack);
        for (const tag in ext.mode?.components) {
            const cls = componentClasses.get(tag) ?? backups.get('component');
            componentClasses.set(tag, ext.mode!.components[tag](cls));
        }
        if (ext.requires) {
            for (const pack of ext.requires) {
                requires.add(pack);
            }
        }
        if (ext.mode?.autoKeywords) {
            for (const section in ext.mode.autoKeywords) {
                autoKeywords.set(section, ext.mode.autoKeywords[section]);
            }
        }
    }
    
    // import packs
    for (const pack of packs) {
        allPacks.add(pack);
        const ext = await importExtension(pack);
        if (ext.requires) {
            for (const pack of ext.requires) {
                requires.add(pack);
            }
        }
    }

    for (const pack of requires) {
        allPacks.add(pack);
        await importExtension(pack);
    }

    // fill lib and automatic keywords
    for (const pack of allPacks) {
        const ext = accessExtension(pack);
        for (const section in ext.lib) {
            Object.assign((lib as any)[section], ext.lib[section]);
        }
        for (const [section, color] of autoKeywords) {
            for (const name in ext[section]) {
                const info = ext[section][name];
                lib.keyword[pack + ':' + section + '.' + name] = [info.intro, color, info.name];
            }
        }
    }
}

/**
 * Render the next UITick.
 */
async function render() {
    const tick = ticks.shift()!;
    try {
        // check if tick is a full UI reload
        const [sid, tags, props, calls] = tick;
        for (const key in tags) {
            if (tags[key] === 'arena') {
                await loadArena(props[key].ruleset, props[key].packs);
                break;
            }
        }
        if (!loaded) {
            throw('UI not loaded')
        }
        
        // clear unfinished function calls (e.g. selectCard / selectTarget)
        if (sid !== stageID) {
            trigger('stage');
            listeners.stage.clear();
            stageID = sid;
        }

        // create new components
        const newComponents: Promise<unknown>[] = [];
        for (const key in tags) {
            const id = parseInt(key);
            const tag = tags[key]
            if (typeof tag === 'string') {
                components.get(id)?.remove();
                const cmp = create(tag);
                components.set(id, cmp);
                componentIDs.set(cmp, id);
                newComponents.push(cmp.ready);
            }
        }
        await Promise.all(newComponents);

        // update component properties
        let hooks: any[] = [];
        for (const key in props) {
            hooks = hooks.concat(components.get(parseInt(key))!.update(props[key], false));
        }
        for (const [hook, cmp, newVal, oldVal] of hooks) {
            hook.apply(cmp, [newVal, oldVal]);
        }

        // call component methods
        for (const key in calls) {
            const id = parseInt(key);
            for (const [method, arg] of calls[key]) {
                components.get(id)![method as keyof Component](arg);
            }
        }

        // delete components
        for (const key in tags) {
            const id = parseInt(key);
            if (tags[key] === null) {
                const cmp = components.get(id);
                if (cmp) {
                    removeListeners(cmp);
                    components.delete(id);
                    componentIDs.delete(cmp);
                    cmp.remove();
                }
            }
        }
    }
    catch (e) {
        console.log(e);
        if (Date.now() - loaded < 500) {
            // prompt reload if error occus within 0.5s after reload
            loaded = 0;
            app.confirm('游戏错误', {content: '点击“确定”重新载入游戏，点击“取消”尝试继续。'}).then(reload => {
                if (reload === true) {
                    window.location.reload();
                }
                else if (reload === false) {
                    send(-1, null, false);
                }
            });
        }
        else if (loaded) {
            // tell worker to reload UI
            loaded = 0;
            send(-1, null, false);
        }
    }
}

/** Render UITick(s). */
async function loop() {
    if (paused) {
        paused = false;
        while (ticks.length) {
            await render();
        }
        paused = true;
    }
}

/** Remove all listeners. */
function removeListeners(cmp: Component) {
    for (const key in listeners) {
        (listeners as any)[key].delete(cmp);
    }
}