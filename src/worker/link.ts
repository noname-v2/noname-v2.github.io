import type { Game, HistoryItem } from './game';

/** Private game method passed to constructor. */
type Update = (this: Game, id: number, item: HistoryItem) => void;

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

    /** Reference to this.#game.#update */
    #update: Update;

    constructor(id: number, tag: string, game: Game, update: Update) {
        this.#id = id;
        this.#tag = tag;
        this.#game = game;
        this.#update = update;
        update.apply(game, [this.#id, tag]);
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
        this.#update.apply(this.#game, [this.#id, items]);
    }

    /** Call a component method. */
    call(method: string, arg?: any) {
        this.#update.apply(this.#game, [this.#id, [method, arg]]);
    }

    /** Monitor the return value of a component call. */
    monitor(monitor: string) {
        this.#game.activeStage!.monitor(this.#id, monitor);
    }

    /** Pause step 3 of active stage until return value is received. */
    await() {
        this.#game.activeStage!.await(this.#id);
    }

    /** Remove reference to a component. */
    unlink() {
        this.#update.apply(this.#game, [this.#id, null]);
    }

    /** Get tag and object of all properties. */
    flatten(): [string, {[key: string]: any}] {
        return [this.#tag, Object.fromEntries(this.#props)];
    }
}