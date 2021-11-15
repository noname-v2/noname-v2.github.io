import { room } from '../worker/globals';
import { tick } from '../worker/worker';
import type { Dict } from '../types';

/** All link classes. */
export * from '../../build/link-types';

/** Default link data. */
export interface LinkData {
    /* Link owner. */
    owner: string;
}

/** Alias for typeof Link. */
export type LinkClass = { new(id: number, tag: string): Link };

/** Worker-side component controller. */
export class Link<T extends LinkData = LinkData> {
    /** Component ID. */
    #id: number;

    /** Component tag. */
    #tag: string;

    /** Component data proxy. */
    #data: T;

    /** Map containing component data. */
    #props = new Map<string, any>();

    get id() {
        return this.#id;
    }

    get tag() {
        return this.#tag;
    }

    get data() {
        return this.#data;
    }

    /** Component owner. */
    get owner() {
        return this.#props.get('owner');
    }

    /** Return value from component.respond(). */
    get result() {
        return room.currentStage.results.get(this.id) ?? null;
    }

    constructor(id: number, tag: string) {
        this.#id = id;
        this.#tag = tag;
        this.#data = new Proxy({}, {
            get: (_, key: string) => {
                return this.#props.get(key);
            },
            set: (_, key: string, val: any) => {
                this.update({[key]: val});
                return true;
            }
        }) as T;

        tick(id, tag);
        room.links.set(id, this);
    }

    update(items: Dict) {
        for (const key in items) {
            const val = items[key] ?? null;
            if (val === null) {
                this.#props.delete(key);
            }
            else {
                this.#props.set(key, val);
            }
        }
        tick(this.id, items);
    }

    unlink() {
        tick(this.id, null);
        room.links.delete(this.id);
    }

    patch(key: string, diff: Dict) {
        if (!this.#props.has(key)) {
            this.#props.set(key, {});
        }
        room.arena.utils.apply(this.#props.get(key), diff);
        tick(this.id, { ['^' + key]: diff });
    }

    call(method: string, ...args: any[]) {
        tick(this.id, [method, args]);
    }

    monitor(callback: string) {
        room.currentStage.monitors.set(this.id, callback);
    }

    await(timeout?: number | null) {
        const stage = room.currentStage;
        stage.awaits.set(this.id, timeout || null);
        if (timeout) {
            setTimeout(() => {
                if (stage === room.currentStage && stage.awaits.has(this.id)) {
                    stage.results.delete(this.id);
                    stage.awaits.delete(this.id);
                    if (!stage.awaits.size) {
                        room.loop();
                    }
                }
            }, timeout * 1000);
        }
    }

    pack() {
        return Object.fromEntries(this.#props);
    }
}