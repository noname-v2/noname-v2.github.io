import type { Game } from './game';


/** A link to a client-side component. */
export class Link {
    /** Component ID. */
    #id: number;

    /** Properties synced with worker. */
    #props = new Map<string, any>();

    /** Reference to Game. */
    #game: Game;

    constructor(id: number, tag: string, game: Game) {
        this.#id = id;
        this.#game = game;
        this.set('#tag', tag);
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

    get sync() {
        return this.get('#sync');
    }

    set sync(sync: boolean) {
        this.set('#sync', sync);
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

    /** Call a component method from its owner. Special methods:
     * #unlink: Remove reference to this.
     * #yield: Send return value of component.yield().
    */
    call(method: string, arg?: any) {
        this.#game.activeStage!.call(this.#id, [method, arg]);
    }

    /** Monitor the return value of a component call. */
    monitor(monitor: string | null = null) {
        this.#game.activeStage!.monitor(this.#id, monitor);
    }

    /** Remove reference to a component. */
    unlink() {
        this.call('#unlink');
    }
}