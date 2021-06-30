var main = {
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
                console.log('createPlayers');
            }
        }
    },
    ruleset: {
        config: {},
        stage: {}
    }
};

export default main;
