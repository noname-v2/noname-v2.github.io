const card = {
    moveTo: {
        content() {
        }
    },
    discard: {
        content() {
        }
    },
    shuffle: {
        content() {
        }
    }
};

const player = {
    choose: {
        content() {
            console.log('choose');
        }
    }
};

const stage = {
    before: {
        async content() {
        }
    },
    main: {
        async content() {
            await this.getRule().apply(this);
        }
    },
    after: {
        async content() {
        }
    }
};

const game = {
    init: {
        content() {
            this.add('createLobby');
            this.add('createGame');
        },
        contents: {
            createLobby() {
                const lobby = this.create('lobby');
                this.lobbyID = lobby.id;
                const heropacks = {};
                const cardpacks = {};
                const configs = {};
                for (const name of this.game.packs) {
                    const heropack = this.getRule(name, 'heropack');
                    const cardpack = this.getRule(name, 'cardpack');
                    if (heropack) {
                        heropacks[name] = heropack;
                    }
                    if (cardpack) {
                        cardpacks[name] = cardpack;
                    }
                }
                const fullConfigs = this.getRule('#config');
                for (const name in fullConfigs) {
                    configs[name] = {};
                    configs[name].name = fullConfigs[name].name;
                    configs[name].intro = fullConfigs[name].intro;
                    configs[name].options = fullConfigs[name].options;
                    configs[name].requires = fullConfigs[name].requires;
                    configs[name].confirm = fullConfigs[name].confirm;
                    if (!(name in this.game.config)) {
                        this.game.config[name] = fullConfigs[name].init;
                    }
                }
                const np = this.getRule(this.game.mode + ':mode').np;
                let npmax;
                if (typeof np === 'number') {
                    this.game.config.np = np;
                    npmax = np;
                }
                else {
                    npmax = np[np.length - 1];
                    const nps = [];
                    for (const n of np) {
                        nps.push([n, `<span class="mono">${n}</span>人`]);
                    }
                    configs.np = {
                        name: '游戏人数',
                        options: nps,
                        init: npmax
                    };
                    this.game.config.np = npmax;
                }
                lobby.set('pane', { heropacks, cardpacks, configs });
                lobby.set('npmax', npmax);
                this.add('awaitStart');
                this.add('cleanUp');
            },
            awaitStart() {
                const lobby = this.game.links.get(this.parent.lobbyID);
                lobby.owner = this.game.uid;
                lobby.syncing = true;
                lobby.set('mode', this.game.mode);
                lobby.set('config', this.game.config);
                lobby.set('disabledHeropacks', Array.from(this.game.disabledHeropacks));
                lobby.set('disabledCardpacks', Array.from(this.game.disabledCardpacks));
                lobby.monitor('updateLobby');
            },
            updateLobby(lobby, [type, key, val]) {
                if (type === 'sync') {
                    this.game.config.online = val;
                    lobby.set('config', this.game.config);
                }
                else if (type === 'config') {
                    if (key === 'online') {
                        if (val) {
                            this.game.connect(val);
                        }
                        else {
                            this.game.disconnect();
                        }
                    }
                    else {
                        this.game.config[key] = val;
                        lobby.set('config', this.game.config);
                    }
                }
                else if (type === 'hero') {
                    this.game.disabledHeropacks[val ? 'delete' : 'add'](key);
                    lobby.set('disabledHeropacks', Array.from(this.game.disabledHeropacks));
                }
                else if (type === 'card') {
                    this.game.disabledCardpacks[val ? 'delete' : 'add'](key);
                    lobby.set('disabledCardpacks', Array.from(this.game.disabledCardpacks));
                }
            },
            cleanUp() {
                const lobby = this.game.links.get(this.parent.lobbyID);
                lobby.unlink();
                this.game.freeze();
            },
            createGame() {
            }
        }
    },
    chooseHero: {
        content() {
            console.log('chooseHero');
        }
    },
    loop: {
        content() {
            console.log('loop');
        }
    }
};

const config = {
    online: {
        name: '联机模式',
        intro: '允许其他玩家通过主页的联机键加入游戏。',
        init: false
    },
    online_join: {
        name: '允许中途加入',
        intro: '允许旁观玩家在游戏过程中加入游戏。',
        init: true,
        requires: 'online'
    },
    online_timeout: {
        name: '出牌时限',
        init: 30,
        options: [
            [15, '<span class="mono">15</span>秒'],
            [30, '<span class="mono">30</span>秒'],
            [60, '<span class="mono">1</span>分钟'],
            [120, '<span class="mono">2</span>分钟']
        ],
        requires: 'online'
    },
    online_specify: {
        name: '点将',
        intro: '允许玩家在游戏开始前自由选择武将。',
        init: false,
        requires: 'online'
    },
    online_mulligan: {
        name: '手气卡',
        intro: '游戏开始时玩家可以更换一至两次手牌。',
        init: 0,
        options: [
            [0, '禁用'],
            [1, '一次'],
            [2, '两次']
        ],
        requires: 'online'
    },
    mulligan: {
        name: '手气卡',
        intro: '游戏开始时玩家可以更换任意次手牌。',
        init: false,
        requires: '!online'
    }
};

var main = {
    dependencies: ['standard', 'maneuver'],
    ruleset: { card, player, stage, game, config, gameStage: '#game.loop/' }
};

export default main;
