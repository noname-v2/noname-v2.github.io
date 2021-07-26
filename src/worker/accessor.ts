import type { Game } from './game';
import type { Worker } from './worker';
import type { Dict } from '../utils';

/** Accessor of game and worker properties and methods. */
export class Accessor {
    /** Original game object. */
    #game: Game;

    /** Original worker object. */
    #worker: Worker;

    get owner() {
        return this.#worker.uid;
    }

    get mode() {
        return this.#game.mode;
    }

    get config() {
        return this.#game.config;
    }

    get packs() {
        return this.#game.packs;
    }

    get banned() {
        return this.#game.banned;
    }

    get playerLinks() {
        return this.#worker.getPeers({player: true});
    }

    get spectatorLinks() {
        return this.#worker.getPeers({player: false});
    }

    constructor(game: Game, worker: Worker) {
        this.#game = game;
        this.#worker = worker;
    }

    /** Connect to remote hub. */
    connect(url: string) {
        this.#worker.connect(url);
    }

    /** Disconnect from remote hub. */
    disconnect() {
        this.#worker.disconnect();
    }

    /** Access extension content. */
    getExtension(path: string) {
        return this.#game.getExtension(path);
    }

    /** Get links to peers. */
    getPeers(filter?: Dict) {
        return this.#worker.getPeers(filter);
    }

    /** Send room info to hub. */
    syncRoom() {
        this.#game.syncRoom();
    }

    /** Mark game as started. */
    start() {
        this.#game.start();
    }
}