import type { SGS } from '../sgs/sgs';

export default {
    mode: {
        ruleset: 'sgs',
        name: '智斗',
        np: 3,
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
        inherit: 'sgs',
        tags: ['double-hero', 'trio']
    }
} as SGS;