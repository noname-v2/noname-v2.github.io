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

                    main() {
                        this.addTask('lobby');
                        this.addTask('setup');
                        this.add('chooseHero');
                        this.addTask('loop');
                    }
                    chooseHero() {
                        const choices = this.game.getHeros();
                        const heros = new Map();
                        for (const id of this.game.players.keys()) {
                            heros.set(id, this.game.utils.rgets(choices, this.nheros, true));
                        }
                        this.addTask('chooseHero', {heros});
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