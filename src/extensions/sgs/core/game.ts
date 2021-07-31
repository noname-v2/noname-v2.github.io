import type { Accessor } from '../../../worker/accessor';
import type { Card } from './card';
import type { Player } from './player';
import type { Skill } from './skill';

export function game(A: typeof Accessor) {
    return class Game extends A {
        players: Player[] = [];
        cards: Card[] = [];
        skills: Skill[] = [];

        backup() {

        }

        restore() {

        }

        createPlayer() {
            return this.createInstance('player') as Player;
        }

        createCard() {
            return this.createInstance('card') as Card;
        }
    } 
}