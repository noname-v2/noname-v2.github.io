import type { PopContent } from '../../../../components/arena/pop';
import type { createChoose } from './choose';

export function createPop(T: ReturnType<typeof createChoose>) {
    return class ChoosePop extends T {
        /** Player IDs and their pop contents. */
        pop!: Map<number, PopContent>;

        main() {
            this.openDialog();
            this.startTimer();
        }

        openDialog() {
            for (const [id, content] of this.pop) {
                const player = this.game.players.get(id);
                if (player?.owner) {
                    const pop = this.game.create('pop');
                    pop.owner = player.owner;
                }
            }
        }
    }
}