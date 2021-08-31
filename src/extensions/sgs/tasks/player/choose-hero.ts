import type { createPop } from './choose-pop';
import type { PopConfirm, Select, Link } from '../../types';
import type { Point } from '../../../../components';

export function createHero(T: ReturnType<typeof createPop>) {
    return class ChoosePop extends T {
        heros!: Map<number, string[] | Select<string>>;
        freeChoose = false;

        main() {
            this.pop = new Map();
            for (const [id, heros] of this.heros) {
                const confirm: PopConfirm = ['ok'];
                if (!this.forced) {
                    confirm.push('cancel');
                }
                if (this.freeChoose) {
                    confirm.push(['pick', '点将', 'blue']);
                }
                this.pop.set(id, [
                    ['caption', '选择武将'],
                    ['hero', heros],
                    ['confirm', confirm]
                ]);
            }
            super.main();
        }

        pick(pop: Link, e: Point) {
            pop.call('pick', [e, this.game.config.heropacks]);
        }
    }
}