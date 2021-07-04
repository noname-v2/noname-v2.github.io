import type { SGS } from '../sgs/sgs';

export default <SGS>{
    mode: {
        ruleset: 'sgs',
        name: '对弈',
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
    tags: ['autochess!']
}