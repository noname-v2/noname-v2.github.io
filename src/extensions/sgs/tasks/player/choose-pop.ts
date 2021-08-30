import type { PopContent } from '../../../../components/arena/pop';
import type { createChoose } from './choose';
import type { Link, Player } from '../../types';

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
            console.log(this.results);
        }

        filter(selections: (string | number)[][], pop: Link) {
            // map of sections and its selected items
            const sections = new Map<any, [(string | number)[], (string | number)[]]>();
            
            // get lists of all items and selected items
            let all: any[] = [];
            for (const section of pop.content) {
                const sel = section[1];
                if (Array.isArray(sel.items)) {
                    all = all.concat(sel.items);
                    for (const selection of selections) {
                        if (selection.length && sel.items.includes(selection[0])) {
                            sections.set(sel, [sel.items, selection]);
                            break;
                        }
                    }
                    if (!sections.has(sel)) {
                        sections.set(sel, [sel.items, []]);
                    }
                }
            }

            // get selectable items
            for (const [sel, selected] of sections) {

            }
            const selectable = [];
            for(const section of pop.content) {
                if (Array.isArray(section[1])) {
                    for (const selected of selections) {
                        console.log(selected);
                    }
                }
            }
        }
    }
}