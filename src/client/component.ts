import type { Client } from './client';

// type for component constructor
export type ComponentClass = {tag: string | null, new(client: Client, tag: string, id: number | null): Component};

export abstract class Component {
    /** Properties synced with worker. */
    private props = new Map<string, any>();

    /** Component ID (for worker-managed components). */
    private id: number | null;

    /** HTMLElement tag  name */
    static tag: string | null = null;

    /** Root element. */
	node: HTMLElement;

    /** Client object. */
    client: Client;

    /** Resolved */
    ready: Promise<unknown>;

    get db() {
        return this.client.db;
    }

    get ui() {
        return this.client.ui;
    }

    get app() {
        return this.client.ui.app;
    }

    get owner() {
        return this.get('owner');
    }

    /** Create node. */
    constructor(client: Client, tag: string, id: number | null) {
        this.client = client;
        this.id = id;
        this.node = client.ui.createElement(tag);
        this.ready = Promise.resolve().then(() => this.init());
    }

    /** Make init() optional for subclasses. */
    init() {};

    /** Property getter. */
    get(key: string): any {
        return this.props.get(key) ?? null;
    }

    /** Property setter. */
    set(key: string, val: any) {
        this.update({[key]: val});
    }

    /** Update properties. Reserved key:
     * owner: uid of client that controlls the component
    */
    update(items: {[key: string]: any}, hook: boolean = true) {
        const hooks = [];
        for (const key in items) {
            const oldVal = this.get(key);
            const newVal = items[key] ?? null;
            newVal === null ? this.props.delete(key) : this.props.set(key, newVal);
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
        if (this.id === null) {
            throw('element is has no ID');
        }
        this.client.send(this.id, result, false);
    }

    /** Send return value to worker (component must be monitored). */
    return(result: any) {
        if (this.id === null) {
            throw('element is has no ID');
        }
        this.client.send(this.id, result, true);
    }

    /** Remove element. */
    remove() {
        this.node.remove();
    }
}