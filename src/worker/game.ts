import { globals } from './globals';
import { freeze } from '../utils';
import * as utils from '../utils';

/** Hub related functions. */
class Hub {
    connect(url: string) {
        globals.worker.connect(url); 
    }
    disconnect() {
        globals.worker.disconnect();
    }
    update() {
        globals.room.update();
    }
    get peers() {
        return globals.worker.getPeers();
    }
    get players() {
        return globals.worker.getPeers({playing: true});
    }
    get spectators() {
        return globals.worker.getPeers({playing: false});
    }
}

/** Game object used by stages. */
export abstract class Game {
    /** Communication with remote hub. */
    #hub = new Hub();

    get owner() {
        return globals.worker.uid;
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
        return this.#hub;
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
        freeze(this.config);
        globals.room.progress = 1;
        this.#hub.update();
    }

    /** Mark game as over. */
    over() {
        globals.room.progress = 2;
        this.#hub.update();
    }

    /** Backup game state. */
    abstract backup(): void;

    /** Restore game state. */
    abstract restore(): void;
}