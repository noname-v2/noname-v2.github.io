var main = {
    mode: {
        ruleset: 'sgs',
        name: '国战',
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
        config: {},
        stage: {}
    },
    heropack: '国战标准',
    cardpack: '国战标准',
    tags: ['guess-side', 'double-hidden!']
};

export default main;
