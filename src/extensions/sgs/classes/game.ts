import type { Game } from '../../../game/game';
import type { Player, Card, Skill } from '../types';

export function game(G: typeof Game) {
    return class Game extends G {
        /** Map of all players, cards and skills. */
        players = new Map<number, Player>();
        cards = new Map<number, Card>();
        skills = new Map<number, Skill>();

        /** Backup game progress. */
        backup() {

        }

        /** Restore game progress. */
        restore() {

        }

        /** Create a new player. */
        createPlayer() {
            const player = this.createInstance('player', this, 'player') as Player;
            this.players.set(player.id, player);
            return player;
        }

        /** Create a new card. */
        createCard() {
            const card = this.createInstance('card', this, 'card') as Card;
            this.cards.set(card.id, card);
            return card;
        }
    } 
}