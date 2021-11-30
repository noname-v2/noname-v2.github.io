import type { Player } from '../../../types-worker';

export function player(P: typeof Player) {
    return class Player extends P {
        test() {
            // this.createPlayer();
        }
    };
}