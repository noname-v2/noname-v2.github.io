var main = {
    mode: {
        name: '攻城',
        np: 2,
        tasks: {
            main(Task) {
                return class Identity extends Task {
                    main() {
                        this.addTask('lobby');
                        this.addTask('setup');
                        this.addTask('chooseHero', { np: 7 });
                        this.addTask('loop');
                    }
                };
            }
        },
        inherit: 'auto'
    },
    tags: ['auto!']
};

export default main;
