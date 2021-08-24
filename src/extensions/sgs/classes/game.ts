import type { Game } from '../../../worker/game';
import type { Card } from './card';
import type { Player } from './player';
import type { Skill } from './skill';

export function game(A: typeof Game) {
    return class Game extends A {
        /** Map of all players, cards and skills. */
        players = new Map<number, Player>();
        cards = new Map<number, Card>();
        skills = new Map<number, Skill>();

        backup() {

        }

        restore() {

        }

        createPlayer() {
            const player = this.createInstance('player', this, 'player') as Player;
            this.players.set(player.id, player);
            return player;
        }

        createCard() {
            const card = this.createInstance('card', this, 'card') as Card;
            this.cards.set(card.id, card);
            return card;
        }
    } 
}