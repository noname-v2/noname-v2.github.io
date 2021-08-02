var main = {
    mode: {
        name: '竞技',
        np: [4, 6, 8],
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
        inherit: 'identity'
    },
    tags: ['leader']
};

export default main;
