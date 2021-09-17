import type { Card } from '../../../links/link';

export function card(C: typeof Card) {
    return class Card extends C {
        test2() {
            // this.createPlayer();
        }
    }
}