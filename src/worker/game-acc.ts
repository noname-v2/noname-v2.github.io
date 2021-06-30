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

    /** Reference to client.ui.app.arena. */
    arena!: Link;

    constructor(game: Game) {
        this.#game = game;
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
}
