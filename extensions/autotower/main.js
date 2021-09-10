var main = {
    mode: {
        name: '塔防',
        np: 6,
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
        inherit: 'auto'
    },
    tags: ['auto!']
};

export default main;
