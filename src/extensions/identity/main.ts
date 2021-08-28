import type { SGS } from '../sgs/types';

export default {
    mode: {
        name: '身份',
        np: [2, 3, 4, 5, 6, 7, 8],
        tasks: {
            main(Task) {
                return class Identity extends Task {
                    /** Number of hero choices. */
                    nheros = 10;

                    /** Options for chooseHero. */
                    config = {
                        heros: new Map<number, string[]>(),
                        forced: true,
                        freeChoose: false
                    };

                    main() {
                        this.addTask('lobby');
                        this.addTask('setup');
                        this.add('sleep', 0.5);
                        this.add('setConfig');
                        this.addTask('chooseHero', this.config);
                        this.addTask('loop');
                    }

                    setConfig() {
                        const choices = this.game.getHeros();
                        for (const id of this.game.players.keys()) {
                            this.config.heros.set(id, Array.from(this.game.utils.rgets(choices, this.nheros, true)));
                        }
                        if (this.game.hub.connected) {
                            this.config.freeChoose = this.game.config.online_choose;
                        }
                        else {
                            this.config.freeChoose = this.game.config.choose;
                        }
                    }
                }
            }
        },
        config: {
            identity: {
                name: '选择身份',
                init: 'random',
                options: [
                    ['random', '随机'],
                    ['zhu', '主公'],
                    ['zhong', '忠臣'],
                    ['nei', '内奸'],
                    ['fan', '反贼'],
                ],
                requires: '!online'
            }
        },
        inherit: 'sgs'
    },
    tags: ['guess-side', 'leader']
} as SGS;