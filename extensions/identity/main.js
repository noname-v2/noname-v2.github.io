var main = {
    mode: {
        name: '身份',
        np: [2, 3, 4, 5, 6, 7, 8],
        tasks: {
            main(Task) {
                return class Identity extends Task {
                    /** Number of hero choices. */
                    nheros = 10;
                    /** Option for chooseHero. */
                    heros = new Map();
                    main() {
                        this.addTask('lobby');
                        this.addTask('setup');
                        this.add('sleep', 0.5);
                        this.add('getHeros');
                        this.addTask('chooseHero', { heros: this.heros });
                        this.addTask('loop');
                    }
                    getHeros() {
                        const choices = this.game.getHeros();
                        for (const id of this.game.players.keys()) {
                            this.heros.set(id, Array.from(this.game.utils.rgets(choices, this.nheros, true)));
                        }
                    }
                };
            }
        },
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
        inherit: 'sgs'
    },
    tags: ['guess-side', 'leader']
};

export default main;
