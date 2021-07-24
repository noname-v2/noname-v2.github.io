import type { SGS } from '../sgs/sgs';

export default <SGS>{
    mode: {
        name: '塔防',
        np: [1, 2, 3, 4],
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
}