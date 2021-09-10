import type { createChoosePop, PopConfirm } from './choose-pop';
import type { Select, Link } from '../../../types';
import type { Point } from '../../../../components';

export function createHero(T: ReturnType<typeof createChoosePop>) {
    return class ChoosePop extends T {
        heros!: Map<number, string[] | Select>;
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
            this.add('dispatchPick');
        }

        /** Dispatch user-picked heros. */
        dispatchPick() {
            for (const [pop, id] of this.pops) {
                // check selection
                const sels = this.selects.get(id)!;
                console.log(pop.result);
                console.log(this.checkSelection(pop.result, sels));
                console.log(this.checkSelection({hero:pop.result.picked.slice(0, 2)}, sels));
            }
        }

        /** Callback when user clicks pick button. */
        callPick(pop: Link, e: Point) {
            if (this.game.connected) {
                pop.call('togglePick');
            }
            else {
                pop.call('pick', [e, this.game.heropacks]);
            }
        }
    }
}