import type { Task } from '../../types';

export function setup(T: typeof Task) {
    return class Setup extends T {
        main() {
            this.add('createPlayers');
            this.add('assignSeat')
            this.add('takeSeat')
            this.add('createCards');
        }

        /** Create all players and add to arena. */
        createPlayers() {
            for (let i = 0; i < this.game.config.np; i++) {
                this.game.createPlayer().link.seat = i;
            }
        }

        /** Assign clients to players. */
        assignSeat() {
            const players = this.game.utils.rgets(this.game.players.values(), this.game.hub.players?.length || 1);
            const peers = this.game.hub.players;

            for (const player of players) {
                if (peers?.length) {
                    const peer = peers.pop()!;
                    player.link.owner = peer.owner;
                    player.link.nickname = peer.nickname;
                }
                else {
                    if (!peers) {
                        player.link.owner = this.game.owner;
                    }
                    break;
                }
            }
        }

        /** Update locations of players in arena. */
        takeSeat() {
            const ids = [];
            for (const player of this.game.players.values()) {
                ids.push(player.id);
            }
            this.game.arena.players = ids;
            this.game.arena.np = this.game.config.np;
        }

        /** Create card pile. */
        createCards() {

        }
    }
}