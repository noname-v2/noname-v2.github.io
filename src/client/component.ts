import { globals } from './globals';
import * as platform from '../platform';
import * as utils from '../utils';
import type { Listeners } from './client';
import type { Dict } from '../types';
import type { TransitionDuration } from '../components';

/** Type for component constructor. */
export type ComponentClass = {
    tag: string | null;
    virtual: boolean;
    new(tag: string, id: number | null, virtual: boolean): Component;
};

export class Component {
    /** HTMLElement tag  name */
    static tag: string | null = null;

    /** Component without DOM element for communication with worker. */
    static virtual = false;

    /** Root element. */
	#node!: HTMLElement;

    /** Resolved */
    #ready: Promise<unknown>;

    /** This.remove() is being executed. */
    #removing = false;

    /** Properties synced with worker. */
    #props = new Map<string, any>();

    /** Component ID (for worker-managed components). */
    #id: number | null;

    get node() {
        return this.#node;
    }

    get ready() {
        return this.#ready;
    }

    get app() {
        return globals.app;
    }

    get platform() {
        return platform;
    }

    get utils() {
        return utils;
    }

    get db() {
        return globals.db;
    }

    get ui() {
        return globals.ui;
    }

    get owner() {
        return this.get('owner');
    }

    get mine() {
        return this.owner === globals.client.uid;
    }

    /** Create node. */
    constructor(tag: string, id: number | null, virtual: boolean) {
        this.#id = id;
        this.#ready = Promise.resolve().then(() => this.init());
        if (!virtual) {
            this.#node = this.ui.createElement(tag);
        }
    }

    /** Optional initialization method. */
    init() {};

    /** Property getter. */
    get(key: string): any {
        return this.#props.get(key) ?? null;
    }

    /** Property setter. */
    set(key: string, val: any) {
        this.update({[key]: val});
    }

    /** Update properties. Reserved key:
     * owner: uid of client that controlls the component
    */
    update(items: Dict, hook: boolean = true) {
        const hooks = [];
        for (const key in items) {
            const oldVal = this.get(key);
            const newVal = items[key] ?? null;
            newVal === null ? this.#props.delete(key) : this.#props.set(key, newVal);
            const hook = this['$' + key as keyof Component];
            if (typeof hook === 'function') {
                hooks.push([hook, this, newVal, oldVal]);
            }
        }

        if (hook) {
            for (const [hook, cmp, newVal, oldVal] of hooks) {
                hook.apply(cmp, [newVal, oldVal]);
            }
        }
        return hooks;
    }

    /** Send update to worker (component must be monitored). */
    yield(result: any) {
        if (this.#id === null) {
            throw('element is has no ID');
        }
        globals.client.send(this.#id, result, false);
    }

    /** Send return value to worker (component must be monitored). */
    respond(result?: any) {
        if (this.#id === null) {
            throw('element is has no ID');
        }
        globals.client.send(this.#id, result, true);
    }

    /** Add component event listener. */
    listen<T extends keyof Listeners>(this: Listeners[T], event: T) {
        globals.client.listeners[event].add(this);
    }

    /** Delay for a time period. */
    sleep(dur: TransitionDuration) {
        return this.utils.sleep(this.app.getTransition(dur) / 1000)
    }

    /** Remove element. */
    remove(promise?: Promise<any>) {
        if (this.#removing) {
            return;
        }

        if (promise) {
            this.#removing = true;
            promise.then(() => {
                this.node.remove();
                this.#removing = false;
            });
        }
        else {
            this.node.remove();
        }
    }
}