import type { SGS } from '../sgs/sgs';

export default {
    mode: {
        name: '战棋',
        np: [4, 6, 8],
        tasks: {
            main(Task) {
                return class Identity extends Task {
                    main() {
                        this.addTask('lobby');
                        this.addTask('createPlayers');
                        this.addTask('chooseHero', {np: 7});
                        this.addTask('loop');
                    }
                }
            }
        },
        inherit: 'auto'
    },
    heropack: '战棋标准',
    cardpack: '战棋标准',
    tags: ['auto!']
} as SGS;