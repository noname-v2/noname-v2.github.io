import type { Card } from '../../../types-worker';

export function card(C: typeof Card) {
    return class Card extends C {
        test2() {
            // this.createPlayer();
        }
    }
}