import type { createPop } from './choose-pop';
import type { PopConfirm, Select, Link } from '../../types';
import type { Point } from '../../../../components';

export function createHero(T: ReturnType<typeof createPop>) {
    return class ChoosePop extends T {
        heros!: Map<number, string[] | Select<string>>;
        pick = false;

        main() {
            this.pop = new Map();
            for (const [id, heros] of this.heros) {
                const confirm: PopConfirm = ['ok'];
                if (!this.forced) {
                    confirm.push('cancel');
                }
                if (this.pick) {
                    confirm.push(['callPick', '点将']);
                }
                this.pop.set(id, [
                    ['caption', '选择武将'],
                    ['hero', heros],
                    ['confirm', confirm]
                ]);
            }
            super.main();
        }

        callPick(pop: Link, e: Point) {
            pop.call('pick', [e, this.game.config.heropacks]);
        }
    }
}