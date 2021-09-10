import { Task } from '../game/task';
import type { Select, Selected, Dict } from '../types';

export class Choose extends Task {
    /** Has time limit. */
    timeout: number | null = null;

    /** Allow not choosing. */
    forced: boolean = false;

    /** Time limit for choosing. */
    getTimeout(): number | null {
        return this.timeout ?? (this.game.connected ? this.game.config.timeout ?? null : null);
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