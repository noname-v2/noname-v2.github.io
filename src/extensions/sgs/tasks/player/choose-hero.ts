import type { createPop } from './choose-pop';
import type { Dict } from '../../types';

export function createHero(T: ReturnType<typeof createPop>) {
    return class ChoosePop extends T {
        heros!: Dict<string[]>;

        main() {
            console.log(this.game.getHeros())
            this.pop = {test: []};
            super.main();
        }
    }
}