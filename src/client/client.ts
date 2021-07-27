import { Database } from './database';
import { UI } from './ui';
import { version, config } from '../version';
import { Component } from './component';
import * as utils from '../utils';
import type { Peer } from '../components';
import type { UITick, ClientMessage } from '../worker/worker';

/**
 * Executor of worker commands.
 */
export class Client {
    /** Client version. */
    readonly version = version;

    /** Worker object. */
    connection: Worker | WebSocket | null = null;

    /** Service worker. */
    readonly registration: ServiceWorkerRegistration | null = null;

    /** User identifier. */
    readonly uid!: string;

    /** IndexedDB manager. */
    readonly db: Database = new Database();

    /** Component manager. */
    readonly ui: UI = new UI(this);

    /** Debug mode */
    debug: boolean = false;

    /** Module containing JS utilities. */
    readonly utils = utils;

    /** Event listeners. */
    readonly listeners = {
        // connection status change
        sync: new Set<{sync: () => void}>(),
        // document resize
        resize: new Set<{resize: () => void}>(),
        // back button pressed (Android)
        history: new Set<{history: (state: string) => void}>(),
        // keyboard event
        key: new Set<{key: (e: KeyboardEvent) => void}>(),
        // stage change
        stage: new Set<{key: () => void}>()
    };

    /** Components synced with the worker. */
    #components = new Map<number, Component>();

    /** ID of current stage. */
    #stageID = 0;

    /**  UITicks waiting for dispatch. */
    #ticks: UITick[] = [];

    /** Timestamp of the last full UI load. */
    #loaded = 0;

    constructor() {
        // disallow changing listener keys
        Object.freeze(this.listeners);

        // get user identifier
        this.db.ready.then(() => {
            if (!this.db.get('uid')) {
                this.db.set('uid', this.utils.uid());
            }
            (this as any).uid = this.db.get('uid');
        });

        // register service worker for PWA
        navigator.serviceWorker?.register('/service.js').then(reg => {
            (this as any).registration = reg;
        });
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
            this.db.get('nickname') || config.nickname,
            this.db.get('avatar') || config.avatar
        ];
    }

    /** WebSocket address. */
    get url() {
        return this.db.get('ws') || config.ws;
    }

    /** Connected remote clients. */
    get peers(): Peer[] | null {
        const ids = this.ui.app?.arena?.get('peers');
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

    /** Connect to a game server. */
    connect(config: [string, string[]] | string) {
        this.disconnect();

        if (Array.isArray(config)) {
            const worker = this.connection = new Worker(`dist/worker.js`, { type: 'module'});
            worker.onmessage = ({data}) => {
                if (data === 'ready') {
                    worker.onmessage = ({data}) => this.dispatch(data);
                    config.push(this.db.get(config[0] + ':disabledHeropacks') || []);
                    config.push(this.db.get(config[0] + ':disabledCardpacks') || []);
                    config.push(this.db.get(config[0] + ':config') || {});
                    config.push(this.info);
                    this.send(0, config, true);
                }
            }
        }
        else {
            this.connection = new WebSocket(config);
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
        this.connection = null;
        this.clear();
    }

    /** Clear currently connection status without disconnecting. */
    clear(back: boolean = true) {
        for (const cmp of this.#components.values()) {
            this.#removeListeners(cmp);
        }

        this.#components.clear();
        this.ui.app.clearPopups();
        this.ui.app.arena?.remove();
        this.ui.app.arena = null;

        if (back) {
            this.ui.app.splash.show();
            this.#stageID = 0;
        }
    }

    /**
     * Send message to worker.
     * @param {number} id - Message id.
     * @param {boolean} err - Whether an error is encountered.
     * @param {...any[]} args - Message content.
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

    /** Add a UITick to dispatch. */
    dispatch(data: UITick) {
        this.#ticks.push(data);
        if (this.#ticks.length === 1) {
            this.#render();
        }
    }

    /** Trigger a listener. */
    trigger(event: 'sync' | 'resize' | 'history' | 'key' | 'stage', arg?: any) {
        for (const cmp of this.listeners[event]) {
            (cmp as any)[event](arg);
        }
    }

    /**
     * Call or check the existence of a plugin method.
     * @param {number} id - ID of the method call.
     * @param {string} name - Plugin name .
     * @param {string} method - Method to be called or checked.
     * @param {any[]} [args] - If args is array, call method with args as arguments,
     * if args is undefined, check the existence of the method instead.
     */
    async #render() {
        try {
            const [sid, tags, props, calls] = this.#ticks[0];

            // check if tick is a full UI reload
            for (const key in tags) {
                if (tags[key] === 'arena') {
                    const arena = this.ui.app.arena;
                    if (arena && this.ui.app.popups.size) {
                        arena.faded = true;
                    }
                    this.clear(false);
                    this.#loaded = Date.now();
                    if (arena) {
                        await this.ui.app.sleep('fast');
                    }
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
                    const cmp = this.ui.create(tag, null, id);
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
                this.ui.app.confirm('游戏错误', {content: '点击“确定”重新载入游戏，点击“取消”尝试继续。'}).then(reload => {
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

        this.#ticks.shift();
        if (this.#ticks.length) {
            this.#render();
        }
    }

    /** Remove all listeners. */
    #removeListeners(cmp: Component) {
        for (const key in this.listeners) {
            (this.listeners as any)[key].delete(cmp);
        }
    }
}