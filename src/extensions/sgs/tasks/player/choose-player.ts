import type { createChoose } from './choose';

export function createChoosePlayer(T: ReturnType<typeof createChoose>) {
    return class ChoosePlayer extends T {
        main() {
            console.log('choosePlayer', this.select);
        }

        test2() {

        }
    }
}