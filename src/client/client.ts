import { Database } from './database';
import { UI } from './ui';
import { version, config } from '../version';
import { Component } from './component';
import type { UITick, ClientMessage } from '../worker/worker';

/**
 * Executor of worker commands.
 */
export class Client {
    /** Client version. */
    version = version;

    /** Worker object. */
    connection: Worker | WebSocket | null = null;

    /** Service worker. */
    registration: ServiceWorkerRegistration | null = null;

    /** User identifier. */
    uid!: string;

    /** ID of current stage. */
    sid = 0;

    /** IndexedDB manager. */
    db: Database = new Database();

    /** Component manager. */
    ui: UI = new UI(this);

    /** Debug mode */
    debug: boolean = false;

    /** Components synced with the worker. */
    components = new Map<number, Component>();

    /** Event listeners. */
    listeners = {
        sync: new Set<{sync: () => void}>(),
        resize: new Set<{resize: () => void, id: number | null}>(),
        history: new Set<{history: (state: string) => void}>(),
        key: new Set<{key: (e: KeyboardEvent) => void}>()
    };

    /** Components awaiting response from worker. */
    yielding = new Map<number, (result: any) => any>();

    /**  UITicks waiting for dispatch. */
    private ticks = <UITick[]>[];

    /** Timestamp of the last full UI load. */
    private loaded = 0;

    constructor() {
        // get user ID
        this.db.ready.then(() => {
            if (!this.db.get('uid')) {
                // create a new unique client id based on current timestamp
                const seed = new Date().getTime().toString();
                
                // map timestamp to random string
                this.db.set('uid', seed.split('').map(n => {
                    // [0-9] -> [0-62]
                    const c = Math.floor((parseInt(n) + Math.random()) * 6.2);

                    // [0-62] -> [A-Z] | [a-z] | [0-9]
                    return String.fromCharCode(c < 26 ? c + 65 : (c < 52 ? c + 71 : c - 4));
                }).join(''));
            }

            this.uid = this.db.get('uid');
        });

        // register service worker for PWA
        navigator.serviceWorker?.register('/service.js').then(reg => {
            this.registration = reg;
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
    get peers(): {[key: string]: [string, string, number]} | null {
        return this.ui.app?.arena?.get('peers') ?? null;
    }

    /** Fetch and parse json file. */
	readJSON<T>(...args: string[]) {
		return new Promise<T>(resolve => {
            fetch(args.join('/')).then(response => {
                response.json().then(resolve);
            });
		});
	}

    /** Connect to web worker. */
    connect(config: [string, string[]] | string) {
        this.disconnect();

        if (Array.isArray(config)) {
            const connection = this.connection = new Worker(`dist/worker.js`, { type: 'module'});
            connection.onmessage = ({data}) => {
                if (data === 'ready') {
                    connection.onmessage = ({data}) => this.tick(data);
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
        for (const cmp of this.components.values()) {
            this.removeListeners(cmp);
        }
        this.components.clear();
        this.yielding.clear();
        this.ui.app.clearPopups();
        this.ui.app.arena?.remove();
        this.ui.app.arena = null;
        if (back) {
            this.ui.app.splash.show();
            this.sid = 0;
        }
    }

    /**
     * Send message to worker.
     * @param {number} id - Message id.
     * @param {boolean} err - Whether an error is encountered.
     * @param {...any[]} args - Message content.
     */
    send(id: number, result: any, done: boolean) {
        const msg = <ClientMessage>[this.uid, this.sid, id, result, done];
        if (this.connection instanceof Worker) {
            this.connection.postMessage(msg)
        }
        else if (this.connection instanceof WebSocket) {
            this.connection.send('resp:' + JSON.stringify(msg));
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
    async dispatch() {
        try {
            const [sid, updates, calls] = this.ticks[0];

            // expect a full UI reload if this.loaded == 0
            if (this.loaded === 0) {
                for (const id in updates) {
                    if (updates[id]['#tag'] === 'arena') {
                        this.clear(false);
                        this.loaded = Date.now();
                        break;
                    }
                }
                if (!this.loaded) {
                    throw('UI not loaded')
                }
            }

            // progress to a new stage
            if (sid !== this.sid) {
                this.yielding.clear();
                this.sid = sid;
            }

            // update component properties
            for (const key in updates) {
                const items = updates[key];
                const id = parseInt(key);

                // create new component
                if (typeof items['#tag'] === 'string') {
                    this.components.get(id)?.remove();
                    const component = this.ui.create(items['#tag']);
                    component.id = id;
                    this.components.set(id, component);
                }
                await this.components.get(id)!.ready;
            }
            
            // update properties after component initialization
            for (const key in updates) {
                const items = updates[key];
                const id = parseInt(key);
                this.components.get(id)!.update(items);
            }

            // call component methods
            for (const key in calls) {
                const id = parseInt(key);
                for (const [method, arg] of calls[key]) {
                    if (method === '#unlink') {
                        const cmp = this.components.get(id);
                        if (cmp) {
                            this.removeListeners(cmp);
                            this.components.delete(id);
                        }
                    }
                    else if (method === '#yield') {
                        this.yielding.get(id)!(arg);
                    }
                    else {
                        const component = this.components.get(id)!;
                        await component.ready;
                        component[method as keyof Component](arg);
                    }
                }
            }
        }
        catch (e) {
            console.log(e);
            if (Date.now() - this.loaded < 500) {
                // prompt reload if error occus within 0.5s after reload
                this.loaded = 0;
                this.ui.app.confirm('游戏错误', {content: '点击“确定”重新载入游戏，点击“取消”尝试继续。'}).then(reload => {
                    if (reload === true) {
                        window.location.reload();
                    }
                    else if (reload === false) {
                        this.send(-1, null, false);
                    }
                });
            }
            else if (this.loaded) {
                // tell worker to reload UI
                this.loaded = 0;
                this.send(-1, null, false);
            }
        }

        this.ticks.shift();
        if (this.ticks.length) {
            this.dispatch();
        }
    }

    /** Add a UITick to dispatch. */
    tick(data: UITick) {
        this.ticks.push(data);
        if (this.ticks.length === 1) {
            this.dispatch();
        }
    }

    /** Trigger a listener. */
    triggerListeners(event: 'sync' | 'resize' | 'history' | 'key', arg?: any) {
        for (const cmp of this.listeners[event]) {
            (cmp as any)[event](arg);
        }
    }
    /** Remove all listeners. */
    removeListeners(cmp: Component) {
        for (const key in this.listeners) {
            (this.listeners as any)[key].delete(cmp);
        }
    }
}