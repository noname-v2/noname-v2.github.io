import type { TaskClass } from '../types';

export function setup(T: TaskClass) {
    return class Setup extends T {
        main() {
            this.add('createPlayers');
            this.add('assignPeers')
            this.add('createCards');
        }

        /** Create all players and add to arena. */
        createPlayers() {
            // set total player number for arena
            const np = this.game.arena.np = this.game.config.np;
            const ids = [];
            for (let i = 0; i < np; i++) {
                const player = this.game.createPlayer();
                player.link.seat = i;
                ids.push(player.id);
            }
            this.game.arena.players = ids;
        }

        /** Assign clients to players. */
        assignPeers() {
            
        }

        /** Create card pile. */
        createCards() {

        }
    }
}