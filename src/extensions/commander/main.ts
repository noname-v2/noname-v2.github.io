import type { Extension } from '../extension';

export default <Extension>{
    mode: {
        ruleset: 'sgs',
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
    tags: ['swap', 'leader']
}