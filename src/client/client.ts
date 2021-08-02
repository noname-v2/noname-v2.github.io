import { Database } from './database';
import { UI } from './ui';
import { globals } from './globals';
import { version, config } from '../version';
import { Component, ComponentClass } from './component';
import { componentClasses } from '../classes';
import { importExtension } from '../extension';
import * as utils from '../utils';
import type { Peer } from '../components';
import type { UITick, ClientMessage } from '../worker/worker';
import type { ExtensionMeta } from '../types';

/**
 * Executor of worker commands.
 */
export class Client {
    /** Debug mode */
    debug: boolean = false;

    /** Client version. */
    #version = version;

    /** Worker object. */
    #connection: Worker | WebSocket | null = null;

    /** Service worker. */
    #registration: ServiceWorkerRegistration | null = null;

    /** User identifier. */
    #uid!: string;

    /** Module containing JS utilities. */
    #utils = utils;

    /** Components synced with the worker. */
    #components = new Map<number, Component>();

    /** ID of current stage. */
    #stageID = 0;

    /**  UITicks waiting for dispatch. */
    #ticks: UITick[] = [];

    /** Timestamp of the last full UI load. */
    #loaded = 0;

    /** This.#loop is not running. */
    #paused = true;

	/** A copy of origional component classes. */
	#componentClasses = new Map(componentClasses);

    /** Event listeners. */
    #listeners = Object.freeze({
        // connection status change
        sync: new Set<{sync: () => void}>(),
        // document resize
        resize: new Set<{resize: () => void}>(),
        // keyboard event
        key: new Set<{key: (e: KeyboardEvent) => void}>(),
        // stage change
        stage: new Set<{key: () => void}>()
    });

    get version() {
        return this.#version;
    }

    get connection() {
        return this.#connection;
    }

    get registration() {
        return this.#registration;
    }

    get uid() {
        return this.#uid;
    }

    get utils() {
        return this.#utils;
    }

    get listeners() {
        return this.#listeners;
    }

    /** Client platform. */
    get platform(): 'iOS' | 'Android' | 'Desktop' {
        if (navigator.platform === 'iPhone' || (navigator.platform === 'MacIntel' && 'ontouchend' in document)) {
            return 'iOS';
        }
        else if (navigator.userAgent.includes('Android')) {
            return 'Android';
        }
        else {
            return 'Desktop';
        }
    }

    /** Client is mobile platform. */
    get mobile() {
        return ['iOS', 'Android'].includes(this.platform) && 'ontouchend' in document;
    }

    /** Initialization message. */
    get info(): [string, string] {
        return [
            globals.db.get('nickname') || config.nickname,
            globals.db.get('avatar') || config.avatar
        ];
    }

    /** WebSocket address. */
    get url() {
        return globals.db.get('ws') || config.ws;
    }

    /** Connected remote clients. */
    get peers(): Peer[] | null {
        const ids = globals.ui.app?.arena?.get('peers');
        if (!ids) {
            return null;
        }

        const peers = [];
        for (const id of ids) {
            const cmp = this.#components.get(id);
            if (cmp) {
                peers.push(cmp as Peer);
            }
        }
        return peers;
    }

    /** Peer component representing current client. */
    get peer(): Peer | null {
        for (const peer of this.peers || []) {
            if (peer.owner === this.uid) {
                return peer;
            }
        }
        return null;
    }

    constructor() {
        globals.client = this;
        const db = globals.db = new Database();
        globals.ui = new UI();

        // get user identifier
        db.ready.then(() => {
            if (!db.get('uid')) {
                db.set('uid', this.utils.uid());
            }
            this.#uid = db.get('uid');
        });

        // register service worker for PWA
        navigator.serviceWorker?.register('/service.js').then(reg => {
            this.#registration = reg;
        });
    }

    /** Connect to a game server. */
    connect(config: [string, string[]] | string) {
        this.disconnect();

        if (Array.isArray(config)) {
            const worker = this.#connection = new Worker(`dist/worker.js`, { type: 'module'});
            worker.onmessage = ({data}) => {
                if (data === 'ready') {
                    worker.onmessage = ({data}) => this.dispatch(data);
                    config.push(globals.db.get(config[0] + ':disabledHeropacks') || []);
                    config.push(globals.db.get(config[0] + ':disabledCardpacks') || []);
                    config.push(globals.db.get(config[0] + ':config') || {});
                    config.push(this.info);
                    this.send(0, config, true);
                }
            }
        }
        else {
            this.#connection = new WebSocket(config);
        }
    }

    /** Disconnect from web worker. */
    disconnect() {
        if (this.connection instanceof Worker) {
            this.connection.terminate();
        }
        else if (this.connection instanceof WebSocket) {
            this.connection.close();
        }
        this.#connection = null;
        this.clear();
    }

    /** Clear currently connection status without disconnecting. */
    clear(back: boolean = true) {
        for (const cmp of this.#components.values()) {
            this.#removeListeners(cmp);
        }

        this.#components.clear();
        globals.ui.app.clearPopups();
        globals.ui.app.arena?.remove();
        this.#unload();

        if (back) {
            globals.ui.app.splash.show();
            this.#stageID = 0;
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
    send(id: number, result: any, done: boolean) {
        const msg: ClientMessage = [this.uid, this.#stageID, id, result, done];
        if (this.connection instanceof Worker) {
            this.connection.postMessage(msg)
        }
        else if (this.connection instanceof WebSocket) {
            this.connection.send('resp:' + JSON.stringify(msg));
        }
    }

    /** Add a UITick to render queue. */
    dispatch(data: UITick) {
        this.#ticks.push(data);
        if (this.#paused) {
            this.#loop();
        }
    }

    /** Trigger a listener. */
    trigger(event: 'sync' | 'resize' | 'key' | 'stage', arg?: any) {
        for (const cmp of this.listeners[event]) {
            (cmp as any)[event](arg);
        }
    }

    /** Get component by ID. */
    get(id: number) {
        return this.#components.get(id);
    }

    /** Get extension meta data. */
    async getMeta(pack: string, full: boolean = false) {
        try {
            const meta = {} as ExtensionMeta;
            const ext = await importExtension(pack);
			if (ext.heropack || ext.cardpack) {
				meta.pack = true;
			}
			if (ext.mode?.name) {
				meta.mode = ext.mode.name
			}
			if (ext.tags) {
				meta.tags = ext.tags;
			}
			if (ext.hero) {
				meta.images = Object.keys(ext.hero);
			}
			return meta;
		}
		catch (e) {
			console.log(e, name);
            return null;
		}
    }

    /** Overwrite components by mode. */
    async #load(ruleset: string[]) {
        for (const pack of ruleset) {
            const ext = await importExtension(pack);
            for (const tag in ext.mode?.components) {
                const cls = componentClasses.get(tag) ?? (Component as ComponentClass);
                componentClasses.set(tag, ext.mode!.components[tag](cls));
            }
        }
    }

	/** Clear loaded mode components. */
	#unload() {
        componentClasses.clear();
        for (const [key, val] of this.#componentClasses.entries()) {
            componentClasses.set(key, val);
        }
	}

    /**
     * Render the next UITick.
     */
    async #render() {
        const tick = this.#ticks.shift()!;

        try {
            // check if tick is a full UI reload
            const [sid, tags, props, calls] = tick;
            for (const key in tags) {
                if (tags[key] === 'arena') {
                    const arena = globals.ui.app.arena;
                    if (arena && globals.ui.app.popups.size) {
                        arena.faded = true;
                    }
                    this.clear(false);
                    this.#loaded = Date.now();
                    if (arena) {
                        await globals.ui.app.sleep('fast');
                    }
                    await this.#load(props[key].ruleset);
                    break;
                }
            }
            if (!this.#loaded) {
                throw('UI not loaded')
            }
            
            // clear unfinished function calls (e.g. selectCard / selectTarget)
            if (sid !== this.#stageID) {
                this.trigger('stage');
                this.listeners.stage.clear();
                this.#stageID = sid;
            }

            // create new components
            const newComponents: Promise<unknown>[] = [];
            for (const key in tags) {
                const id = parseInt(key);
                const tag = tags[key]
                if (typeof tag === 'string') {
                    this.#components.get(id)?.remove();
                    const cmp = globals.ui.create(tag, null, id);
                    this.#components.set(id, cmp);
                    newComponents.push(cmp.ready);
                }
            }
            await Promise.all(newComponents);

            // update component properties
            let hooks: any[] = [];
            for (const key in props) {
                hooks = hooks.concat(this.#components.get(parseInt(key))!.update(props[key], false));
            }
            for (const [hook, cmp, newVal, oldVal] of hooks) {
                hook.apply(cmp, [newVal, oldVal]);
            }

            // call component methods
            for (const key in calls) {
                const id = parseInt(key);
                for (const [method, arg] of calls[key]) {
                    this.#components.get(id)![method as keyof Component](arg);
                }
            }

            // delete components
            for (const key in tags) {
                const id = parseInt(key);
                if (tags[key] === null) {
                    const cmp = this.#components.get(id);
                    if (cmp) {
                        this.#removeListeners(cmp);
                        this.#components.delete(id);
                        cmp.remove();
                    }
                }
            }
        }
        catch (e) {
            console.log(e);
            if (Date.now() - this.#loaded < 500) {
                // prompt reload if error occus within 0.5s after reload
                this.#loaded = 0;
                globals.ui.app.confirm('游戏错误', {content: '点击“确定”重新载入游戏，点击“取消”尝试继续。'}).then(reload => {
                    if (reload === true) {
                        window.location.reload();
                    }
                    else if (reload === false) {
                        this.send(-1, null, false);
                    }
                });
            }
            else if (this.#loaded) {
                // tell worker to reload UI
                this.#loaded = 0;
                this.send(-1, null, false);
            }
        }
    }

    /** Render UITick(s). */
    async #loop() {
        if (this.#paused) {
            this.#paused = false;
            while (this.#ticks.length) {
                await this.#render();
            }
            this.#paused = true;
        }
    }

    /** Remove all listeners. */
    #removeListeners(cmp: Component) {
        for (const key in this.listeners) {
            (this.listeners as any)[key].delete(cmp);
        }
    }
}