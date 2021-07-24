var main = {
    mode: {
        ruleset: 'sgs',
        name: '智斗',
        np: 3,
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
    inherit: 'sgs'
};

export default main;
