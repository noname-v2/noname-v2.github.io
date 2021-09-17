import type { Task } from '../../../types';

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
            for (let i = 0; i < this.arena.config.np; i++) {
                this.arena.create('player').data.seat = i;
            }
        }

        /** Assign clients to players. */
        assignSeat() {
            const players = this.arena.utils.rgets(this.arena.players.values(), this.arena.hub.players?.length || 1);
            const peers = this.arena.hub.players;

            for (const player of players) {
                if (peers?.length) {
                    const peer = peers.pop()!;
                    player.data.owner = peer.owner;
                    player.data.nickname = peer.data.nickname;
                }
                else {
                    if (!peers) {
                        player.data.owner = this.arena.owner;
                    }
                    break;
                }
            }
        }

        /** Update locations of players in arena. */
        takeSeat() {
            const ids = [];
            for (const player of this.arena.players.values()) {
                ids.push(player.id);
            }
            
            // use arena.update() instead of arena.data to skip type checking
            this.arena.update({
                players: ids,
                np: this.arena.config.np
            });
        }

        /** Create card pile. */
        createCards() {

        }
    }
}