import type { SGS } from '../sgs/sgs';

export default <SGS>{
    mode: {
        ruleset: 'sgs',
        name: '身份',
        content() {
            this.add('#game.init/');
            this.add('createPlayers');
            this.add('#game.chooseHero/');
            this.add('#game.loop/');
        },
        contents: {
            createPlayers() {
                console.log('createPlayers')
            }
        }
    },
    ruleset: {
        config: {
            
        },
        stage: {
            
        }
    },
    tags: ['guess-side']
}