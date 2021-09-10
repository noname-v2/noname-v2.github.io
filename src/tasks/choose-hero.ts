import { ChoosePop } from './choose-pop';
import type { PopConfirm } from '../components/arena/pop';
import type { Select, Link } from '../types';
import type { Point } from '../components';

export class ChooseHero extends ChoosePop {
    /** Heros to choose from. */
    heros!: Map<number, Select>;

    /** Allow picking heros. */
    pick = false;

    main() {
        this.content = new Map();
        for (const [id, heros] of this.heros) {
            const confirm: PopConfirm = ['ok'];
            if (!this.forced) {
                confirm.push('cancel');
            }
            if (this.pick) {
                confirm.push(['callPick', '点将']);
            }
            this.content.set(id, [
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