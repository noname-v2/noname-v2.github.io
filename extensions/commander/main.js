var main = {
    mode: {
        name: '统率',
        np: 2,
        tasks: {
            main(T) {
                return class Identity extends T {
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
