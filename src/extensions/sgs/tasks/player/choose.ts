import { createPop } from './choose-pop';
import { createHero } from './choose-hero';
import { createTarget } from './choose-target';
import type { TaskClass } from '../../types';

export function createChoose(T: TaskClass) {
    return class Choose extends T {
        /** Has time limit. */
        timeout: number | null = null;

        /** Allow not choosing. */
        forced: boolean = false;

        /** Start timer for players. */
        startTimer() {

        }
    }
}

export function choose(T: TaskClass) {
    // abstract base class
    const choose = createChoose(T);

    // choose from a popup dialog
    const choosePop = createPop(choose);

    // choose players and / or cards
    const chooseTarget = createTarget(choose);

    // choose from a list of heros
    const chooseHero = createHero(choosePop);

    return { choose, choosePop, chooseTarget, chooseHero }
}