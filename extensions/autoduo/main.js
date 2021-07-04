var main = {
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
};

export default main;
