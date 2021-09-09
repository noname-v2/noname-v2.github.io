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
            const filter = this.game.createFilter(sel, all, selected, this);
            try {
                for (const item of all) {
                    if (filter(item)) {
                        selectable.push(item);
                    }
                }
            }
            catch {
                return [];
            }
            return selectable;
        }

        /** Check if selected items are legal. */
        checkSelection<T extends string | number>(sel: Select<T>, selected: T[]) {
            const n = selected.length;
            if (typeof sel.num === 'number') {
                if (n !== sel.num) {
                    return false;
                }
            }
            else if (Array.isArray(sel.num)) {
                if (n < sel.num[0] || n > sel.num[1]) {
                    return false;
                }
            }

            const current: T[] = [];
            const filter = this.game.createFilter(sel, selected, current, this);

            for (const item of selected) {
                if (!filter(item)) {
                    return false;
                }
                current.push(item);
            }

            return true;
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