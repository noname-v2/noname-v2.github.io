import type { Game } from './game';
import type { Worker } from './worker';
import type { Dict } from '../utils';

/** Accessor of game and worker properties and methods. */
export abstract class Accessor {
    /** Original game object. */
    #game: Game;

    /** Original worker object. */
    #worker: Worker;

    get owner() {
        return this.#worker.uid;
    }

    get arena() {
        return this.#game.arena;
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
        return this.#worker.getPeers({playing: true});
    }

    get spectatorLinks() {
        return this.#worker.getPeers({playing: false});
    }

    /** Hub related functions. */
    get hub() {
        const connect = (url: string) => this.#worker.connect(url);
        const disconnect = () => this.#worker.disconnect();
        const syncRoom = () => this.#game.syncRoom();
        return { connect, disconnect, syncRoom };
    }

    constructor(game: Game, worker: Worker) {
        this.#game = game;
        this.#worker = worker;
    }

    /** Create a link. */
    create(tag: string) {
        return this.#game.create(tag);
    }

    /** Creata a class in game.#gameClasses. */
    createInstance(name: string, ...args: any[]) {
        return new (this.#game.getClass(name))(...args);
    }

    /** Access extension content. */
    getExtension(path: string) {
        return this.#game.getExtension(path);
    }

    /** Get links to peers. */
    getPeers(filter?: Dict) {
        return this.#worker.getPeers(filter);
    }

    /** Mark game as started. */
    start() {
        this.#game.start();
    }

    /** Mark game as over. */
    over() {
        this.#game.over();
    }

    /** Backup game state. */
    abstract backup(): void;

    /** Restore game state. */
    abstract restore(): void;
}