import type { Game } from '../../../worker/game';
import type { SGS, Player, Card, Skill, PileEntries } from '../types';

export function game(G: typeof Game) {
    return class Game extends G {
        /** Map of all players, cards and skills. */
        players = new Map<number, Player>();
        cards = new Map<number, Card>();
        skills = new Map<number, Skill>();

        /** Available hero packs. */
        get heropacks(): string[] {
            const packs = [];

            for (const pack of this.packs) {
                if (this.config.banned.heropack?.includes(pack)) {
                    continue;
                }

                if (this.accessExtension(pack, 'heropack')) {
                    packs.push(pack);
                }
            }

            return packs;
        }

        /** Available card packs. */
        get cardpacks(): string[] {
            const packs = [];

            for (const pack of this.packs) {
                if (this.config.banned.cardpack?.includes(pack)) {
                    continue;
                }

                if (this.accessExtension(pack, 'cardpack')) {
                    packs.push(pack);
                }
            }

            return packs;
        }

        /** Get a list of all heros. */
        getHeros() {
            const heros = new Set<string>();

            for (const pack of this.heropacks) {
                const ext = this.accessExtension(pack) as SGS;
                for (const name in ext?.hero) {
                    const id = pack + ':' + name;
                    if (this.config.banned?.hero?.includes(id)) {
                        continue;
                    }
                    heros.add(id);
                }
            }
            
            return heros;
        }

        /** Get card pile entries. */
        getPile() {
            const pile: PileEntries = [];

            for (const pack of this.cardpacks) {
                const ext = this.accessExtension(pack) as SGS;
                for (const name in ext?.pile) {
                    for (const suit in ext?.pile[name]) {
                        for (let entry of ext?.pile[name][suit]) {
                            if (typeof entry === 'number') {
                                entry = [entry];
                            }
                            pile.push([name, suit, ...entry]);
                        }
                    }
                }
            }
            
            return pile;
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