import type { Game } from '../../../game/game';

export function game(G: typeof Game) {
    return class Game extends G {
        /** Backup game progress. */
        backup() {

        }

        /** Restore game progress. */
        restore() {

        }
    } 
}