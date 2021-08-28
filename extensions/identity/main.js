var main = {
    mode: {
        name: '身份',
        np: [2, 3, 4, 5, 6, 7, 8],
        tasks: {
            main(Task) {
                return class Identity extends Task {
                    /** Number of hero choices. */
                    nheros = 10;
                    /** Choice of heros for players. */
                    choices;
                    get freeChoose() {
                        if (this.game.hub.connected) {
                            return this.game.config.online_choose;
                        }
                        else {
                            return this.game.config.choose;
                        }
                    }
                    main() {
                        this.addTask('lobby');
                        this.addTask('setup');
                        this.add('sleep', 0.5);
                        this.add('chooseZhu');
                        this.add('chooseRest');
                        this.addTask('loop');
                    }
                    chooseZhu() {
                        this.choices = this.game.getHeros();
                        const zhu = this.game.utils.rget(this.game.players.values());
                        zhu.link.identity = '主';
                        const heros = new Map();
                        heros.set(zhu.id, this.getChoices());
                        this.addTask('chooseHero', {
                            heros, forced: true, freeChoose: this.freeChoose
                        });
                    }
                    chooseRest() {
                        const heros = new Map();
                        for (const id of this.game.players.keys()) {
                            heros.set(id, this.getChoices());
                        }
                        this.addTask('chooseHero', {
                            heros, forced: true, freeChoose: this.freeChoose
                        });
                    }
                    getChoices() {
                        return Array.from(this.game.utils.rgets(this.choices, this.nheros, true));
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
