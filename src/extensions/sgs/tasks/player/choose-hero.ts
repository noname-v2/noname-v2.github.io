import type { createPop } from './choose-pop';

export function createHero(T: ReturnType<typeof createPop>) {
    return class ChoosePop extends T {
        main() {
            console.log('choosePop', this.pop, this.test, this.select);
        }
    }
}