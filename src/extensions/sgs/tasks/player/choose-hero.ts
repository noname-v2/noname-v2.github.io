import type { createPop } from './choose-pop';
import type { PopConfirm } from '../../../../components/arena/pop';

export function createHero(T: ReturnType<typeof createPop>) {
    return class ChoosePop extends T {
        heros!: Map<number, string[]>;
        freeChoose = false;

        main() {
            this.pop = new Map();
            for (const [id, heros] of this.heros) {
                const confirm: PopConfirm = ['ok'];
                if (!this.forced) {
                    confirm.push('cancel');
                }
                if (this.freeChoose) {
                    confirm.push(['free', '点将', 'blue']);
                }
                this.pop.set(id, [
                    ['caption', '选择武将'],
                    ['hero', heros],
                    ['confirm', confirm]
                ]);
            }
            super.main();
        }
    }
}