import { globals } from './globals';
import * as utils from '../utils';
import type { Dict } from '../types';

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

const hub = new Hub();

/** Game object used by stages. */
export abstract class Game {
    get owner() {
        return globals.worker.uid;
    }

    get arena() {
        return globals.arena;
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
        return hub;
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

    /** Get links to peers. */
    getPeers(filter?: Dict) {
        return globals.worker.getPeers(filter);
    }

    /** Mark game as started. */
    start() {
        globals.room.start();
    }

    /** Mark game as over. */
    over() {
        globals.room.over();
    }

    /** Backup game state. */
    abstract backup(): void;

    /** Restore game state. */
    abstract restore(): void;
}