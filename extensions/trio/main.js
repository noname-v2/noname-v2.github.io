var main = {
    mode: {
        ruleset: 'sgs',
        name: '智斗',
        np: 3,
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
        inherit: 'sgs',
        tags: ['double-hero', 'trio']
    }
};

export default main;
