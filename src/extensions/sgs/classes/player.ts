import type { Player } from '../../../game/player';

export function player(P: typeof Player) {
    return class Player extends P {
        test() {
            // this.createPlayer();
        }
    }
}