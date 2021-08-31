import type { Pop, Point } from '../../../components';

export function pop(T: typeof Pop) {
    return class Pop extends T {
        /** Items added manually. */
        addedItems = new Set<string | number>();

        /** Open popup to pick heros. */
        pick([e, packs]: [Point, string[]]) {
            console.log('ok', e, packs);
        }

        /** Update pick button when checking. */
        check() {
            const ok = super.check();
            if (typeof ok === 'boolean') {
                this.buttons.get('pick')?.classList[!ok ? 'remove' : 'add']('disabled');
            }
            return ok;
        }
    }
}