import { createPop } from './choose-pop';
import { createHero } from './choose-hero';
import { createTarget } from './choose-target';
import type { TaskClass, Link, Select, FilterThis } from '../../types';

export function createChoose(T: TaskClass) {
    return class Choose extends T {
        /** Has time limit. */
        timeout: number | null = null;

        /** Allow not choosing. */
        forced: boolean = false;

        /** Time limit for choosing. */
        getTimeout(): number | null {
            if (this.timeout === null && this.game.hub.connected) {
                return this.game.config.timeout ?? null;
            }
            return this.timeout;
        }

        /** Get a list of selectable items. */
        getSelectable<T extends string | number>(sel: Select<T>, all: T[], selected: T[]): T[] {
            const selectable: T[] = [];
            const n = Array.isArray(sel.num) ? sel.num[1] : sel.num;
            if (n > selected.length) {
                const func = sel.filter ? this.game.accessExtension(sel.filter) : () => true;
                const filterThis = this.game.createFilter(all, selected);
                for (const item of all) {
                    if (!selected.includes(item)) {
                        try {
                            if (func.apply(filterThis, [item, this])) {
                                selectable.push(item);
                            }
                        }
                        catch {}
                    }
                }
            }
            return selectable;
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