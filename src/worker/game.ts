import { globals } from './worker';
import * as utils from '../utils';

/** Game object used by stages. */
export abstract class Game {
    get owner() {
        return globals.room.uid;
    }

    get arena() {
        return globals.room.arena;
    }

    get mode() {
        return globals.room.mode;
    }

    get config() {
        return globals.room.config;
    }

    get packs() {
        return globals.room.packs;
    }

    get hub() {
        return globals.hub;
    }

    get utils() {
        return utils;
    }

    /** Get a link. */
    get(id: number) {
        return globals.room.links.get(id);
    }

    /** Create a link. */
    create(tag: string) {
        return globals.room.create(tag);
    }

    /** Creata a class in game.#gameClasses. */
    createInstance(name: string, ...args: any[]) {
        return new (globals.room.getClass(name))(...args);
    }

    /** Access extension content. */
    getExtension(path: string) {
        return globals.room.getExtension(path);
    }

    /** Mark game as started and disallow changing configuration. */
    start() {
        utils.freeze(this.config);
        globals.room.progress = 1;
        globals.hub.update();
    }

    /** Mark game as over. */
    over() {
        globals.room.progress = 2;
        globals.hub.update();
    }

    /** Backup game state. */
    abstract backup(): void;

    /** Restore game state. */
    abstract restore(): void;
}