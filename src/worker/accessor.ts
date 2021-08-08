import { globals } from './globals';
import type { Dict } from '../types';

/** Hub related functions. */
const hub = {
    connect: (url: string) => globals.worker.connect(url),
    disconnect: () => globals.worker.disconnect(),
    syncRoom: () => globals.game.syncRoom()
};

/** Accessor of game and worker properties and methods. */
export abstract class Accessor {
    get owner() {
        return globals.worker.uid;
    }

    get arena() {
        return globals.arena;
    }

    get mode() {
        return globals.game.mode;
    }

    get config() {
        return globals.game.config;
    }

    get packs() {
        return globals.game.packs;
    }

    get banned() {
        return globals.game.banned;
    }

    get playerLinks() {
        return globals.worker.getPeers({playing: true});
    }

    get spectatorLinks() {
        return globals.worker.getPeers({playing: false});
    }

    get hub() {
        return hub;
    }

    /** Get a link. */
    get(id: number) {
        return globals.game.links.get(id);
    }

    /** Create a link. */
    create(tag: string) {
        return globals.game.create(tag);
    }

    /** Creata a class in game.#gameClasses. */
    createInstance(name: string, ...args: any[]) {
        return new (globals.game.getClass(name))(...args);
    }

    /** Access extension content. */
    getExtension(path: string) {
        return globals.game.getExtension(path);
    }

    /** Get links to peers. */
    getPeers(filter?: Dict) {
        return globals.worker.getPeers(filter);
    }

    /** Mark game as started. */
    start() {
        globals.game.start();
    }

    /** Mark game as over. */
    over() {
        globals.game.over();
    }

    /** Backup game state. */
    abstract backup(): void;

    /** Restore game state. */
    abstract restore(): void;
}