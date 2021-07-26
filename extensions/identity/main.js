var main = {
    mode: {
        name: '身份',
        np: [2, 3, 4, 5, 6, 7, 8],
        tasks: {
            main(Task) {
                return class extends Task {
                    main() {
                        this.addTask('lobby');
                        this.addTask('chooseHero', { np: 7 });
                        this.addTask('loop');
                    }
                };
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
        stage: {}
    },
    tags: ['guess-side', 'leader'],
    inherit: 'sgs'
};

export default main;
