import type { SGS } from '../sgs/sgs';

export default <SGS>{
    mode: {
        ruleset: 'sgs',
        name: '国战',
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
    },
    ruleset: {
        config: {
            
        },
        stage: {
            
        }
    },
    heropack: '国战标准',
    cardpack: '国战标准',
    tags: ['guess-side', 'double-hidden!']
}