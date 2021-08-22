import { room, hub } from './worker';
import * as utils from '../utils';

/** Game object used by stages. */
export abstract class Game {
    get owner() {
        return room.uid;
    }

    get arena() {
        return room.arena;
    }

    get mode() {
        return room.mode;
    }

    get config() {
        return room.config;
    }

    get packs() {
        return room.packs;
    }

    get hub() {
        return hub;
    }

    get utils() {
        return utils;
    }

    /** Get a link. */
    get(id: number) {
        return room.links.get(id);
    }

    /** Create a link. */
    create(tag: string) {
        return room.create(tag);
    }

    /** Creata a class in game.#gameClasses. */
    createInstance(name: string, ...args: any[]) {
        return new (room.getClass(name))(...args);
    }

    /** Access extension content. */
    getExtension(path: string) {
        return room.getExtension(path);
    }

    /** Mark game as started and disallow changing configuration. */
    start() {
        utils.freeze(this.config);
        room.progress = 1;
        hub.update();
    }

    /** Mark game as over. */
    over() {
        room.progress = 2;
        hub.update();
    }

    /** Backup game state. */
    abstract backup(): void;

    /** Restore game state. */
    abstract restore(): void;
}