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
    const choose = createChoose(T);
    const choosePop = createPop(choose);
    const chooseTarget = createTarget(choose);
    const chooseHero = createHero(choosePop);

    return { choose, choosePop, chooseTarget, chooseHero }
}