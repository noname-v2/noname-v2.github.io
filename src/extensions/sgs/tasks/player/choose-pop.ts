import type { PopContent } from '../../../../components/arena/pop';
import type { createChoose } from './choose';
import type { Link, Select, Selected, Dict } from '../../types';

export function createPop(T: ReturnType<typeof createChoose>) {
    return class ChoosePop extends T {
        /** Player IDs and their pop contents. */
        pop!: Map<number, PopContent>;

        /** Player IDs and created popups. */
        pops = new Map<number, Link>();

        main() {
            this.add('openDialog');
            this.add('getResults');
        }

        openDialog() {
            const timer = [this.getTimeout(), Date.now()]

            for (const [id, content] of this.pop) {
                const player = this.game.players.get(id);
                if (player?.owner) {
                    const pop = this.game.create('pop');
                    pop.owner = player.owner;
                    pop.content = content;
                    pop.await(timer[0]);
                    pop.monitor('filter');
                    this.pops.set(player.id, pop);
                    if (timer[0]) {
                        pop.timer = timer;
                        player.link.timer = timer;
                    }
                }
            }
        }

        /** Process client return values. */
        getResults() {
            for (const id of this.pop.keys()) {
                const player = this.game.players.get(id);
                if (player?.link.timer) {
                    player.link.timer = null;
                }
            }

            for (const [id, pop] of this.pops) {
                // remove timers and close pop
                pop.timer = null;
                const player = this.game.players.get(id);
                if (player?.link.timer) {
                    player.link.timer = null;
                }
                this.results.set(id, pop.result);
                pop.unlink();

                // // check selection
                // const sels = this.getSelect(pop);
                // console.log(pop.result);
                // console.log(this.checkSelection(pop.result, sels));
                // console.log(this.checkSelection({hero:pop.result.picked.slice(0, 2)}, sels));
            }
        }

        /** Get selectable items and send to client. */
        filter(selected: Selected | [string, ...any[]], pop: Link) {
            if (Array.isArray(selected)) {
                // custom operations defined by child classes
                try {
                    (this as any)[selected[0]](pop, ...selected.slice(1));
                }
                catch {}
            }
            else {
                // get selectable items
                const selectable = this.getSelectable(selected, this.getSelect(pop));
                pop.call('setSelectable', selectable);
            }
        }

        /** Get all selectable targets from PopContent. */
        getSelect(pop: Link) {
            const sels: Dict<Select> = {};
            for (const section of pop.content) {
                const sel = section[1];
                if (Array.isArray(sel.items)) {
                    sels[section[0]] = sel;
                }
            }
            return sels;
        }
    }
}