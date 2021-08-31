import type { Game } from '../../../worker/game';
import type { SGS, Player, Card, Skill } from '../types';

export function game(G: typeof Game) {
    return class Game extends G {
        /** Map of all players, cards and skills. */
        players = new Map<number, Player>();
        cards = new Map<number, Card>();
        skills = new Map<number, Skill>();

        /** Get a list of all heros. */
        getHeros() {
            const heros = new Set<string>();

            for (const pack of this.packs) {
                const ext = this.accessExtension(pack) as SGS;
                for (const name in ext?.hero) {
                    heros.add(pack + ':' + name);
                }
            }
            
            return heros;
        }

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