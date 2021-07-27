import type { Worker } from './worker';
import type { Dict } from '../utils';

/** A link to a client-side component. */
export class Link {
    /** Component ID. */
    #id: number;

    /** Component tag. */
    #tag: string;

    /** Properties synced with worker. */
    #props = new Map<string, any>();

    /** Reference to Game. */
    #worker: Worker;

    constructor(id: number, tag: string, worker: Worker) {
        this.#id = id;
        this.#tag = tag;
        this.#worker = worker;
        worker.tick(this.#id, tag);
    }

    get id() {
        return this.#id;
    }

    get owner() {
        return this.get('owner');
    }

    set owner(uid: string) {
        this.set('owner', uid);
    }

    /** Property getter. */
    get(key: string): any {
        return this.#props.get(key) ?? null;
    }

    /** Property setter. */
    set(key: string, val: any) {
        this.update({[key]: val});
    }

    /** Update properties. */
    update(items: Dict) {
        for (const key in items) {
            const val = items[key] ?? null;
            val === null ? this.#props.delete(key) : this.#props.set(key, val);
        }
        this.#worker.tick(this.#id, items);
    }

    /** Call a component method. */
    call(method: string, arg?: any) {
        this.#worker.tick(this.#id, [method, arg]);
    }

    /** Remove reference to a component. */
    unlink() {
        this.#worker.tick(this.#id, null);
    }

    /** Get tag and object of all properties. */
    flatten(): [string, Dict] {
        return [this.#tag, Object.fromEntries(this.#props)];
    }
}