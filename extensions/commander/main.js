var main = {
    mode: {
        name: '统率',
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
        inherit: 'sgs'
    },
    tags: ['swap', 'leader']
};

export default main;
