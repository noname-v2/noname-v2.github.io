import { globals } from './globals';
import * as utils from '../utils';
import type { Dict } from '../types';
import type { TransitionDuration } from '../components';

// type for component constructor
export type ComponentClass = {
    tag?: string | null,
    new(tag: string, id: number | null): Component
};

export abstract class Component {
    /** HTMLElement tag  name */
    static tag: string | null = null;

    /** Root element. */
	readonly node: HTMLElement;

    /** Resolved */
    readonly ready: Promise<unknown>;

    /** This.remove() is being executed. */
    #removing = false;

    /** Properties synced with worker. */
    #props = new Map<string, any>();

    /** Component ID (for worker-managed components). */
    #id: number | null;

    get client() {
        return globals.accessor;
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

    get app() {
        return globals.app;
    }

    get arena() {
        return globals.arena;
    }

    get listeners() {
        return globals.client.listeners;
    }

    get owner() {
        return this.get('owner');
    }

    get mine() {
        return this.owner === globals.client.uid;
    }

    /** Create node. */
    constructor(tag: string, id: number | null) {
        this.#id = id;
        this.node = this.ui.createElement(tag);
        this.ready = Promise.resolve().then(() => this.init());
    }

    /** Make init() optional for subclasses. */
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