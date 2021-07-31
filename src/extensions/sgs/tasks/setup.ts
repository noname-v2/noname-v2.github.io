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
            this.game.arena.np = this.game.config.np;
            console.log(this.game.config)
        }

        /** Assign clients to players. */
        assignPeers() {

        }

        /** Create card pile. */
        createCards() {

        }
    }
}