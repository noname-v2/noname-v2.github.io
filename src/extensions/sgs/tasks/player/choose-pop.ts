import type { PopContent } from '../../../../components/arena/pop';
import type { createChoose } from './choose';
import type { Link, Select, Selected, Dict } from '../../types';

export function createPop(T: ReturnType<typeof createChoose>) {
    return class ChoosePop extends T {
        /** Player IDs and their pop contents. */
        pop!: Map<number, PopContent>;

        /** Created popups. */
        pops = new Set<Link>();

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
                    this.pops.add(pop);
                    if (timer[0]) {
                        pop.timer = timer;
                        player.link.timer = timer;
                    }
                }
            }
        }

        getResults() {
            for (const id of this.pop.keys()) {
                const player = this.game.players.get(id);
                if (player?.link.timer) {
                    player.link.timer = null;
                }
            }

            for (const pop of this.pops) {
                pop.timer = null;
                this.results.set(pop.owner!, pop.result);
                pop.unlink();
            }

            for (const selected of this.results.values()) {
                console.log(selected)
                // const sec = selected.slice(0, 2);
                // console.log(sec, this.checkSelection(sel, sec));
                // from here: convert pop to single gallery
            }
        }

        filter(selected: Selected | [string, ...any[]], pop: Link) {
            if (Array.isArray(selected)) {
                // custom operations defined by child classes
                try {
                    (this as any)[selected[0]](pop, ...selected.slice(1));
                }
                catch {}
            }
            else {
                // get selections from pop
                const sels: Dict<Select> = {};
                for (const section of pop.content) {
                    const sel = section[1];
                    if (Array.isArray(sel.items)) {
                        sels[section[0]] = sel;
                    }
                }

                // get selectable items
                const selectable = this.getSelectable(selected, sels);
                pop.call('setSelectable', selectable);
            }
        }
    }
}