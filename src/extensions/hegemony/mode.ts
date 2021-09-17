import type { ModeInfo, Task } from '../../types';

export const mode = {
    name: '国战',
    np: [2, 3, 4, 5, 6, 7, 8],
    tasks: {
        main(T: typeof Task) {
            return class Hegemony extends T {
                /** Number of hero choices. */
                nheros = 10;

                main() {
                    this.addTask('lobby');
                    this.addTask('setup');
                    this.add('sleep', 0.5);
                    this.add('chooseHero');
                }
                
                chooseHero() {
                    const choices = this.arena.heros;
                    const heros = new Map();
                    const nheros = Math.min(this.nheros, Math.floor(choices.size / this.arena.players.size));
                    for (const id of this.arena.players.keys()) {
                        heros.set(id, {
                            items: Array.from(this.arena.utils.rgets(choices, nheros, true)),
                            filter: 'hegemony:mode.choose',
                            num: 2
                        });
                    }
                    this.addTask('chooseHero', {
                        heros, forced: true, pick: this.arena.config.pick || !this.arena.connected
                    });
                    this.addTask('loop');
                }

                filter(name: string, selected: string[]) {
                    console.log(name, selected);
                    return true;
                }
            }
        }
    },
    // choose(this: FilterThis<string>, name: string) {
    //     const faction = this.getInfo('hero', name).faction;
    //     if (this.selected.hero.length) {
    //         return faction === this.getInfo('hero', this.selected.hero[0]).faction;
    //     }
    //     else {
    //         for (const hero of this.items) {
    //             if (hero !== name && faction === this.getInfo('hero', hero).faction) {
    //                 return true;
    //             }
    //         }
    //         return false;
    //     }
    // },
    inherit: 'sgs'
} as ModeInfo;