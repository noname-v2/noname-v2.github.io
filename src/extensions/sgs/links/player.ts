import type { Player } from '../../../links/link';

export function player(P: typeof Player) {
    return class Player extends P {
        test() {
            // this.createPlayer();
        }
    };
}