import type { SGS } from '../sgs/sgs';

export default {
    mode: {
        name: '对弈',
        np: 2,
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
        inherit: 'autochess'
    },
    tags: ['auto!'],
} as SGS;