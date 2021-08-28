import { createPop } from './choose-pop';
import { createHero } from './choose-hero';
import { createTarget } from './choose-target';
import type { TaskClass } from '../../types';

export function createChoose(T: TaskClass) {
    return class Choose extends T {
        main() {
            console.log('choose', this.np);
        }

        select(key: string) {

        }
    }
}

export function choose(T: TaskClass) {
    // base class
    const choose = createChoose(T);

    // choose from a popup dialog
    const choosePop = createPop(choose);

    // choose players and / or cards
    const chooseTarget = createTarget(choose);

    // choose from a list of heros
    const chooseHero = createHero(choosePop);

    return { choose, choosePop, chooseTarget, chooseHero }
}