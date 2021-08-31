import type { TaskClass, FilterThis } from '../sgs/types';

export const mode = {
    name: '国战',
    np: [2, 3, 4, 5, 6, 7, 8],
    tasks: {
        main(T: TaskClass) {
            return class Identity extends T {
                /** Number of hero choices. */
                nheros = 10;

                get freeChoose() {
                    if (this.game.hub.connected) {
                        return this.game.config.online_choose;
                    }
                    else {
                        return this.game.config.choose;
                    }
                }

                main() {
                    this.addTask('lobby');
                    this.addTask('setup');
                    this.add('sleep', 0.5);
                    this.add('chooseHero');
                }
                
                chooseHero() {
                    const choices = this.game.getHeros();
                    const heros = new Map();
                    for (const id of this.game.players.keys()) {
                        heros.set(id, {
                            items: Array.from(this.game.utils.rgets(choices, this.nheros, true)),
                            filter: 'hegemony:mode.choose',
                            num: 2
                        });
                    }
                    this.addTask('chooseHero', {
                        heros, forced: true, freeChoose: this.freeChoose
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
    choose(this: FilterThis<string>, name: string) {
        const faction = this.getHero(name).faction;
        if (this.selected.length) {
            return faction === this.getHero(this.selected[0]).faction;
        }
        else {
            for (const hero of this.all) {
                if (hero !== name && faction === this.getHero(hero).faction) {
                    return true;
                }
            }
            return false;
        }
    },
    inherit: 'sgs'
};