import * as ui from './ui';
import * as db from './db';
import * as platform from '../platform';
import * as utils from '../utils';
import * as client from './client';
import { app, lib } from './globals';
import { debug } from '../meta';
import type { Dict } from '../types';
import type { TransitionDuration } from '../components';

export class Component {
    /** HTMLElement tag  name */
    static tag: string | null = null;

    /** Component without DOM element. */
    static virtual = false;

    /** Root element. */
	#node!: HTMLElement;

    /** Resolved after executing this.init(). */
    #ready: Promise<unknown>;

    /** This.remove() is being executed. */
    #removing = false;

    /** Properties synced with worker. */
    #props = new Map<string, any>();

    /** Property accessor. */
    data: Dict;

    [key: string]: any;

    get node() {
        return this.#node;
    }

    get ready() {
        return this.#ready;
    }

    get app() {
        return app;
    }

    get platform() {
        return platform;
    }

    get utils() {
        return utils;
    }

    get db() {
        return db;
    }

    get ui() {
        return ui;
    }

    get lib() {
        return lib;
    }

    get owner(): string | null {
        return this.data.owner;
    }

    get mine() {
        return this.owner === client.uid;
    }

    get removing() {
        return this.#removing;
    }

    /** Create node. */
    constructor(tag: string) {
        this.#ready = Promise.resolve().then(() => this.init());

        // property accessor
        this.data = new Proxy({}, {
            get: (_, key: string) => {
                return this.#props.get(key) ?? null;
            },
            set: (_, key: string, val: any) => {
                this.update({[key]: val});
                return true;
            }
        });

        // create DOM element
        const cls = this.constructor as typeof Component;
        if (!cls.virtual) {
            this.#node = this.ui.createElement(cls.tag || tag);
        }
    }

    /** Optional initialization method. */
    init() {};

    /** Update properties. Reserved key:
     * owner: uid of client that controls the component
     * ^<key>: update partial property
    */
    update(items: Dict) {
        if (client.componentIDs.has(this) && !client.updating) {
            throw('Cannot update the property of worker-created component.');
        }

        const hooks = [];

        for (let key in items) {
            const partial = key.startsWith('^');
            if (partial) {
                key = key.slice(1);
            }

            const oldVal = this.#props.get(key) ?? (partial ? {} : null);
            const newVal = items[key] ?? null;

            if (partial) {
                this.utils.apply(oldVal, newVal);
            }
            else if (newVal === null) {
                this.#props.delete(key);
            }
            else {
                this.#props.set(key, newVal);
            }

            const hook = this['$' + key as keyof Component];
            if (typeof hook === 'function') {
                hooks.push([hook, this, newVal, oldVal, partial]);
            }
        }

        if (!client.componentIDs.has(this)) {
            for (const [hook, cmp, newVal, oldVal, partial] of hooks) {
                this.ready.then(() => hook.apply(cmp, [newVal, oldVal, partial]));
            }
        }

        return hooks;
    }

    /** Send update to worker (component must be monitored). */
    yield(result: any) {
        if (!client.componentIDs.has(this)) {
            throw('element is has no ID');
        }
        client.send(client.componentIDs.get(this)!, result, false);
    }

    /** Send return value to worker (component must be monitored). */
    respond(result?: any) {
        if (!client.componentIDs.has(this)) {
            throw('element is has no ID');
        }
        client.send(client.componentIDs.get(this)!, result, true);
    }

    /** Add component event listener. */
    listen<T extends keyof client.Listeners>(this: client.Listeners[T], event: T) {
        client.listeners[event].add(this);
    }

    /** Add component event listener. */
    ignore<T extends keyof client.Listeners>(this: client.Listeners[T], event: T) {
        client.listeners[event].delete(this);
    }

    /** Delay for a time period. */
    sleep(dur: TransitionDuration) {
        return this.utils.sleep(this.app.getTransition(dur) / 1000)
    }

    /** Remove element. */
    remove(after?: Promise<any> | Animation) {
        if (this.#removing) {
            return;
        }

        if (after) {
            this.#removing = true;
            this.node.classList.add('removing');
            const onfinish = () => {
                this.node.remove();
                this.node.classList.remove('removing');
                this.#removing = false;
            };
            if (after instanceof Animation) {
                after.onfinish = onfinish
            }
            else {
                after.then(onfinish);
            }
        }
        else {
            this.node.remove();
        }
    }
}

if (debug) {
    (window as any).client = client;
}