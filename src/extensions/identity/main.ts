import type { SGS } from '../sgs/types';

export default {
    mode: {
        name: '身份',
        np: [2, 3, 4, 5, 6, 7, 8],
        tasks: {
            main(Task) {
                return class Identity extends Task {
                    main() {
                        this.addTask('lobby');
                        this.addTask('setup');
                        this.addTask('chooseHero', {np: 7});
                        this.addTask('loop');
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