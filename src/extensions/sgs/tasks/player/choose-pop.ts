import type { PopContent } from '../../../../components/arena/pop';
import type { createChoose } from './choose';

export function createPop(T: ReturnType<typeof createChoose>) {
    return class ChoosePop extends T {
        // player IDs and their pop contents
        pop!: Map<number, PopContent>;

        main() {
            this.openDialog();
        }

        openDialog() {
            console.log(this.pop);
        }
    }
}