import type { SGS } from '../sgs/sgs';

export default {
    mode: {
        name: '对弈',
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
    tags: ['autochess!'],
    inherit: 'autochess'
} as SGS;