import type { PopContent } from '../../../../components/arena/pop';
import type { createChoose } from './choose';
import type { Link, Select, Selected, Dict } from '../../types';

export function createChoosePop(T: ReturnType<typeof createChoose>) {
    return class ChoosePop extends T {
        /** Player IDs and their pop contents. */
        pop!: Map<number, PopContent>;

        /** Player IDs and created popups. */
        pops = new Map<Link, number>();

        /** Select configurations of players. */
        selects = new Map<number, Dict<Select>>();

        main() {
            this.add('openDialog');
            this.add('getResults');
        }

        openDialog() {
            const timer = [this.getTimeout(), Date.now()] as const;

            for (const [id, content] of this.pop) {
                const player = this.game.players.get(id);
                if (player?.owner) {
                    const pop = this.game.create('pop');
                    let order = 0;
                    pop.owner = player.owner;
                    pop.content = content;
                    pop.await(timer[0]);
                    pop.monitor('filter');
                    this.pops.set(pop, player.id);
                    if (timer[0]) {
                        pop.timer = timer;
                        player.link.timer = timer;
                    }

                    // get selection configurations from content
                    const sels: Dict<Select> = {};
                    for (const section of content) {
                        const sel = section[1] as Select;
                        if (sel && Array.isArray(sel.items)) {
                            sel.order = order++;
                            sels[section[0]] = sel;
                        }
                    }
                    this.selects.set(id, sels);
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

            for (const [pop, id] of this.pops) {
                // remove timers and close pop
                pop.timer = null;
                const player = this.game.players.get(id);
                if (player?.link.timer) {
                    player.link.timer = null;
                }
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
                const selectable = this.getSelectable(selected, this.selects.get(this.pops.get(pop)!)!);
                pop.call('setSelectable', selectable);
            }
        }
    }
}