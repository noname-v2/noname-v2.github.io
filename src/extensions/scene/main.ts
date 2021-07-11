import type { Extension } from '../extension';

export default <Extension>{
    mode: {
        ruleset: 'sgs',
        name: '场景',
        np: [2, 3, 4, 5, 6, 7, 8],
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
    }
}