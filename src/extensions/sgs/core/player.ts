import type { Link, Game } from '../types';

class Player {
    /** Game object. */
    game: Game;

    /** Link to player component. */
    link: Link;

    get id() {
        return this.link.id;
    }

    get owner() {
        return this.link.owner;
    }

    constructor(game: Game) {
        this.game = game;
        this.link = game.create('player');
    }


}

export type { Player };
export const player = () => Player;