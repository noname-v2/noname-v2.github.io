var main = {
    mode: {
        name: '运筹',
        np: [2, 4, 6, 8],
        tasks: {
            main(Task) {
                return class Identity extends Task {
                    main() {
                        this.addTask('lobby');
                        this.addTask('createPlayers');
                        this.addTask('chooseHero', { np: 7 });
                        this.addTask('loop');
                    }
                };
            }
        },
        inherit: 'auto'
    },
    tags: ['auto!', 'rts']
};

export default main;
