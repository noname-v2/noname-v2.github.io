import { createPop } from './choose-pop';
import { createHero } from './choose-hero';
import { createTarget } from './choose-target';
import type { TaskClass, Select, Selected, Dict } from '../../types';

export function createChoose(T: TaskClass) {
    return class Choose extends T {
        /** Has time limit. */
        timeout: number | null = null;

        /** Allow not choosing. */
        forced: boolean = false;

        /** Order when checking selection. */
        order = ['skill', 'card', 'player'];

        /** Time limit for choosing. */
        getTimeout(): number | null {
            if (this.timeout === null && this.game.hub.connected) {
                return this.game.config.timeout ?? null;
            }
            return this.timeout;
        }

        /** Get a list of selectable items. */
        getSelectable(selected: Selected, sels: Dict<Select>): (string | number)[] {
            const selectable: (string | number)[] = [];
            const items: Selected = {};

            for (const section in sels) {
                items[section] = sels[section].items;
            }

            for (const section in sels) {
                const filter = this.game.createFilter(section, sels[section], selected, items, this);
                try {
                    for (const item of sels[section].items) {
                        if (filter(item)) {
                            selectable.push(item);
                        }
                    }
                }
                catch {
                    return [];
                }
            }
            return selectable;
        }

        /** Check if selected items are legal. */
        checkSelection(selected: Selected, sels: Dict<Select>) {
            // fake selected items
            const current: Selected = {};

            // get section order
            const order: string[] = [];
            for (const section of this.order) {
                if (sels[section]) {
                    order.push(section);
                }
            }
            for (const section in sels) {
                if (!order.includes(section)) {
                    order.push(section);
                }
                current[section] = [];
            }

            for (const section of order) {
                // check number of selected items
                const n = selected[section].length;
                const sel = sels[section];
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

                // check if selected items satisfy filter
                const filter = this.game.createFilter(section, sel, current, selected, this);
                for (const item of selected[section]) {
                    if (!filter(item)) {
                        return false;
                    }
                    current[section].push(item);
                }
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