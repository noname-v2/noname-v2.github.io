/** Base class for Player, Card and Skill. */
import type { Link, Game } from '../types';

export class Base<T extends Link> {
    /** Game object. */
    game: Game;

    /** Link to player component. */
    link: T;

    get id() {
        return this.link.id;
    }

    get owner() {
        return this.link.owner;
    }

    constructor(game: Game, tag: string) {
        this.game = game;
        this.link = game.create(tag) as T;
    }
}