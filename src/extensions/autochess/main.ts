import type { Extension } from '../extension';

export default <Extension>{
    mode: {
        ruleset: 'sgs',
        name: '战棋',
        np: [4, 6, 8],
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
    heropack: '战棋标准',
    cardpack: '战棋标准',
    tags: ['autochess!']
}