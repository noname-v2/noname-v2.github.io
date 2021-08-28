import type { PopContent } from '../../../../components/arena/pop';
import type { createChoose } from './choose';

export function createPop(T: ReturnType<typeof createChoose>) {
    return class ChoosePop extends T {
        // player IDs and their pop contents
        pop!: PopContent;

        main() {
            console.log('choosePop', this.select);
        }

        test() {

        }
    }
}