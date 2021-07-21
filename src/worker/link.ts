import type { Game } from './game';


/** A link to a client-side component. */
export class Link {
    /** Component ID. */
    #id: number;

    /** Component tag. */
    #tag: string;

    /** Properties synced with worker. */
    #props = new Map<string, any>();

    /** Reference to Game. */
    #game: Game;

    constructor(id: number, tag: string, game: Game) {
        this.#id = id;
        this.#tag = tag;
        this.#game = game;
        this.#game.activeStage!.update(this.#id, tag);
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
    update(items: {[key: string]: any}) {
        for (const key in items) {
            const val = items[key] ?? null;
            val === null ? this.#props.delete(key) : this.#props.set(key, val);
        }
        this.#game.activeStage!.update(this.#id, items);
    }

    /** Call a component method from its owner. */
    call(method: string, arg?: any) {
        this.#game.activeStage!.call(this.#id, [method, arg]);
    }

    /** Monitor the return value of a component call. */
    monitor(monitor: string | null = null) {
        this.#game.activeStage!.monitor(this.#id, monitor);
    }

    /** Remove reference to a component. */
    unlink() {
        this.#game.activeStage!.update(this.#id, null);
    }

    /** Get tag and object of all properties. */
    flatten(): [string, {[key: string]: any}] {
        return [this.#tag, Object.fromEntries(this.#props)];
    }
}