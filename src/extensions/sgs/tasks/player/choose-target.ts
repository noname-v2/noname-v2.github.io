import type { PopContent } from '../../../../components/arena/pop';
import type { createChoose } from './choose';

export function createTarget(T: ReturnType<typeof createChoose>) {
    return class ChooseTarget extends T {
        // player IDs and their pop contents
        pop!: PopContent;

        main() {
            console.log('chooseTarget', this.select);
        }

        test2() {

        }
    }
}