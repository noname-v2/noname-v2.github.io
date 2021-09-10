import type { Game } from './game';
import type { Link } from '../types';

/** Base class for a Link wrapper. */
export class Linked<T extends Link = Link> {
    /** Game object. */
    #game: Game;

    /** Link to player component. */
    #link: T;

    get id() {
        return this.link.id;
    }

    get owner() {
        return this.link.owner ?? null;
    }

    get link() {
        return this.#link;
    }

    get game() {
        return this.#game;
    }

    constructor(game: Game, tag: string) {
        this.#game = game;
        this.#link = game.create(tag) as T;
    }
}