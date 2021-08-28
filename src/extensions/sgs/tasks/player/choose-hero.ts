import type { createPop } from './choose-pop';
import type { Dict } from '../../types';

export function createHero(T: ReturnType<typeof createPop>) {
    return class ChoosePop extends T {
        heros!: Map<number, string[]>;

        main() {
            this.pop = new Map();
            for (const [id, heros] of this.heros) {
                this.pop.set(id, [['caption', '选择武将'], ['hero', heros]]);
            }
            super.main();
        }
    }
}