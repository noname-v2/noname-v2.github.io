import { createChoosePop } from './choose-pop';
import { createHero } from './choose-hero';
import { createChoosePlayer } from './choose-player';
import type { TaskClass, Select, Selected, Dict } from '../../types';

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
        getSelectable(selected: Selected, sels: Dict<Select>): (string | number)[] {
            const selectable: (string | number)[] = [];

            for (const section in sels) {
                const filter = this.game.createFilter(section, selected, sels, this);
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
            for (const section in sels) {
                current[section] = [];
            }

            // get section order
            const order = Object.keys(sels);
            order.sort((a, b) => (sels[a].order - sels[b].order));

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
                const filter = this.game.createFilter(section, current, sels, this);
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
    const choosePop = createChoosePop(choose);

    // choose players and / or cards
    const choosePlayer = createChoosePlayer(choose);

    // choose from a list of heros
    const chooseHero = createHero(choosePop);

    return { choose, choosePop, choosePlayer, chooseHero }
}