import type { Client } from './client';

// type for component constructor
export type ComponentClass = {tag: string | null, new(client: Client, tag: string): Component};

export abstract class Component {
    /** Properties synced with worker. */
    private props = new Map<string, any>();

    /** HTMLElement tag  name */
    static tag: string | null = null;

    /** Component ID (for worker-managed components). */
    id: number | null = null;

    /** Monitor ID. */
    monitor: number | null = null;

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
    constructor(client: Client, tag: string) {
        this.client = client;
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

    /** Update properties. Special key:
     * #tag: tag name (no operation).
     * owner: uid of client that controlls the component
    */
    update(items: {[key: string]: any}) {
        const hooks = [];

        for (const key in items) {
            const oldVal = this.get(key);
            const newVal = items[key] ?? null;
            newVal === null ? this.props.delete(key) : this.props.set(key, newVal);
            const hook = this['$' + key as keyof Component];
            if (typeof hook === 'function') {
                hooks.push([hook, newVal, oldVal]);
            }
        }

        for (const [hook, newVal, oldVal] of hooks) {
            hook.apply(this, [newVal, oldVal]);
        }
    }

    /** Send result to worker (component must be monitored). */
    yield(result: any, done: boolean = true) {
        if (this.id === null) {
            throw('element is has no ID');
        }

        this.client.send(this.id, result, done);

        if (!done) {
            return new Promise(resolve => {
                this.client.yielding.set(this.id!, resolve);
            });
        }
    }
}