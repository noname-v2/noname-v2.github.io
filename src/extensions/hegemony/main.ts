import type { SGS } from '../sgs/sgs';
import { hero } from './hero';
import { card } from './card';
import { skill } from './skill';

export default {
    mode: {
        name: '国战',
        np: [2, 3, 4, 5, 6, 7, 8],
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
        inherit: 'sgs'
    },
    heropack: '国战标准',
    cardpack: '国战标准',
    tags: ['guess-side', 'hero-hidden!', 'double-hero!'],
    hero, card, skill
} as SGS;