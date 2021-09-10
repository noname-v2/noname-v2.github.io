import type { Extension } from '../types';

export default {
    mode: {
        name: '竞技',
        np: [4, 6, 8],
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
        inherit: 'identity'
    },
    tags: ['leader']
} as Extension;