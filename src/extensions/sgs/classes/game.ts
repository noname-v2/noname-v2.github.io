import type { Game } from '../../../worker/game';
import type { Card } from './card';
import type { Player } from './player';
import type { Skill } from './skill';

export function game(A: typeof Game) {
    return class Game extends A {
        players: Player[] = [];
        cards: Card[] = [];
        skills: Skill[] = [];

        backup() {

        }

        restore() {

        }

        createPlayer() {
            return this.createInstance('player', this) as Player;
        }

        createCard() {
            return this.createInstance('card', this) as Card;
        }
    } 
}