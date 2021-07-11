import type { Game } from './game';
import type { Link } from './link';

export class GameAccessor {
    #game: Game;
    
    /** All available heros. */
    heros = <string[]>[];

    /** All available cards. */
    cards = <Link[]>[];

    /** In-game players. */
    players = <Link[]>[];

    constructor(game: Game) {
        this.#game = game;
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

    get disabledHeropacks() {
        return this.#game.disabledHeropacks;
    }

    get disabledCardpacks() {
        return this.#game.disabledCardpacks;
    }

    get rootStage() {
        return this.#game.rootStage.accessor;
    }

    get activeStage() {
        return this.#game.activeStage?.accessor ?? null;
    }

    get links() {
        return this.#game.links;
    }

    get uid() {
        return this.#game.worker.uid;
    }

    /** Disallow changing configuration during game. */
    freeze() {
        this.#game.deepFreeze(this.#game.config);
        this.#game.deepFreeze(this.#game.packs);
        this.#game.deepFreeze(this.#game.disabledHeropacks);
        this.#game.deepFreeze(this.#game.disabledCardpacks);
    }

    /** Connect to remote hub. */
    connect(url: string) {
        this.#game.worker.connect(url);
    }

    /** Disconnect from remote hub. */
    disconnect() {
        this.#game.worker.disconnect();
    }

    /** Get game configuration. */
    get(key: string) {
        return this.#game.config[key];
    }

    /** Set game configuration. */
    set(key: string, val: any) {
        this.#game.config[key] = val;
    }

    /** Freeze config and tell hub about game start. */
    start() {
        if (this.#game.state === 0) {
            this.#game.state = 1;
            this.#game.worker.updateRoom();
        }
    }

    /** Mark game as ended. */
    over() {
        if (this.#game.state === 1) {
            this.#game.state = 2;
            this.#game.worker.updateRoom();
        }
    }

    [key: string]: any;
}