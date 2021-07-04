var main = {
    mode: {
        ruleset: 'sgs',
        name: '战棋',
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
    heropack: '战棋标准',
    cardpack: '战棋标准',
    tags: ['autochess!']
};

export default main;
