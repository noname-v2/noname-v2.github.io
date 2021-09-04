import type { SGS, Select, TaskClass } from '../sgs/types';

export default {
    mode: {
        name: '身份',
        np: [2, 3, 4, 5, 6, 7, 8],
        tasks: {
            main(T: TaskClass) {
                return class Identity extends T {
                    /** Number of hero choices. */
                    nheros = 10;

                    /** Choice of heros for players. */
                    choices!: Set<string>;

                    main() {
                        this.addTask('lobby');
                        this.addTask('setup');
                        this.add('sleep', 0.5);
                        this.add('chooseZhu');
                        this.add('chooseRest');
                    }

                    chooseZhu() {
                        this.choices = this.game.getHeros();
                        const heros = new Map();
                        for (const [id, player] of this.game.players) {
                            if (player.link.seat === 0) {
                                this.game.zhu = player;
                                player.link.identity = 'zhu';
                                heros.set(id, this.getChoices());
                                this.addTask('chooseHero', {
                                    heros, forced: true, pick: this.game.config.pick
                                });
                                break;
                            }
                        }
                    }

                    chooseRest() {
                        const heros = new Map();
                        for (const id of this.game.players.keys()) {
                            if (id !== this.game.zhu.id) {
                                heros.set(id, this.getChoices());
                            }
                        }
                        this.addTask('chooseHero', {
                            heros, forced: true, pick: this.game.config.pick
                        });
                        this.addTask('loop');
                    }

                    getChoices(): Select<string> {
                        return {
                            items: Array.from(this.game.utils.rgets(this.choices, this.nheros, true)),
                            num: 1
                        };
                    }
                }
            }
        },
        config: {
            identity: {
                name: '选择身份',
                init: 'random',
                intro: '使用固定游戏身份。',
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