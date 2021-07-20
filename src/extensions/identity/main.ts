import type { SGS } from '../sgs/sgs';

export default <SGS>{
    mode: {
        ruleset: 'sgs',
        name: '身份',
        np: [2, 3, 4, 5, 6, 7, 8],
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
            identity: {
                name: '选择身份',
                init: 'random',
                options: [
                    ['random', '随机'],
                    ['zhu', '主公'],
                    ['zhong', '忠臣'],
                    ['nei', '内奸'],
                    ['fan', '反贼'],
                ],
                requires: '!online'
            }
        },
        stage: {
            
        }
    },
    tags: ['guess-side', 'leader']
}