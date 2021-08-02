import type { SGS } from '../sgs/types';

export default {
    mode: {
        name: '战棋',
        np: [2, 4, 6, 8],
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
        inherit: 'auto'
    },
    tags: ['auto!']
} as SGS;