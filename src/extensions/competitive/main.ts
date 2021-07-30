import type { SGS } from '../sgs/types';

export default {
    mode: {
        name: '竞技',
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
        inherit: 'identity'
    },
    tags: ['leader']
} as SGS;