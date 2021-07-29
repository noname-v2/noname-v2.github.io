import type { SGS } from '../sgs/sgs';

export default {
    mode: {
        name: '塔防',
        np: 6,
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
    tags: ['auto!']
} as SGS;