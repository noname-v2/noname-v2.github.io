var main = {
    mode: {
        name: '欢乐',
        np: 4,
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
    tags: ['swap']
};

export default main;
