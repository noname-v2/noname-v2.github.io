import type { Card } from '../../../game/card';

export function card(C: typeof Card) {
    return class Player extends C {
        test2() {
            // this.createPlayer();
        }
    }
}