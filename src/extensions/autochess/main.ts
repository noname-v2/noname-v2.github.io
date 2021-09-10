import type { Extension } from '../types';

export default {
    mode: {
        name: '战棋',
        np: [2, 4, 6, 8],
        tasks: {
            main(T) {
                return class Identity extends T {
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
} as Extension;