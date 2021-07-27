import type { SGS } from '../sgs/sgs';

export default {
    mode: {
        name: '统率',
        np: 2,
        content() {
            this.add('#game.init/');
            this.add('createPlayers');
            this.add('#game.chooseHero/');
            this.add('#game.loop/');
        },
        contents: {
            createPlayers() {
                console.log(this.game.packs);
            }
        }
    },
    tags: ['swap', 'leader'],
    inherit: 'sgs'
} as SGS;