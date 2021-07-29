import type { SGS } from '../sgs/sgs';

export default {
    mode: {
        name: '塔防',
        np: [1, 2, 3, 4],
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
        inherit: 'autorts'
    },
    tags: ['auto!', 'rts']
} as SGS;