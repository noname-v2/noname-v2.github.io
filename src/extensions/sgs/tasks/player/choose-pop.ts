import type { PopContent } from '../../../../components/arena/pop';
import type { createChoose } from './choose';
import type { Link } from '../../types';

export function createPop(T: ReturnType<typeof createChoose>) {
    return class ChoosePop extends T {
        /** Player IDs and their pop contents. */
        pop!: Map<number, PopContent>;

        /** Created popups. */
        pops = new Set<Link>();

        main() {
            this.startTimer();
            this.add('openDialog');
            this.add('getResults');
        }

        openDialog() {
            for (const [id, content] of this.pop) {
                const player = this.game.players.get(id);
                if (player?.owner) {
                    const pop = this.game.create('pop');
                    pop.owner = player.owner;
                    pop.content = content;
                    pop.await();
                    this.pops.add(pop);
                }
            }
        }

        getResults() {
            for (const pop of this.pops) {
                this.results.set(pop.owner!, pop.result);
                pop.unlink();
            }
            console.log(this.results);
        }
    }
}