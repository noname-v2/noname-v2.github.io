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
    after: {
        async content() {
        }
    }
};

const game = {
    init: {
        content() {
            this.add('createArena');
            this.add('createLobby');
            this.add('createGame');
        },
        contents: {
            createArena() {
                this.game.arena = this.create('arena');
            },
            createLobby() {
                const lobby = this.create('lobby');
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
                    if (fullConfigs[name].options) {
                        configs[name].options = fullConfigs[name].options;
                    }
                    if (!(name in this.game.config)) {
                        this.game.config[name] = fullConfigs[name].init;
                    }
                }
                lobby.set('pane', { heropacks, cardpacks, configs });
                this.add('awaitStart').lobbyID = lobby.id;
            },
            awaitStart() {
                const lobby = this.game.links.get(this.lobbyID);
                lobby.owner = this.game.uid;
                lobby.set('mode', this.game.mode);
                lobby.set('config', this.game.config);
                lobby.set('disabledHeropacks', Array.from(this.game.disabledHeropacks));
                lobby.set('disabledCardpacks', Array.from(this.game.disabledCardpacks));
                lobby.monitor('updateLobby');
            },
            updateLobby(lobby, [type, key, val]) {
                if (type === 'config') {
                    this.game.config[key] = val;
                    lobby.set('config', this.game.config);
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
        init: 'off',
        options: [
            ['off', '关闭'],
            ['private', '私密'],
            ['public', '公开']
        ]
    },
    specify_hero: {
        name: '点将',
        intro: '允许玩家自由选择武将。',
        init: false
    },
    allow_mulligan: {
        name: '手气卡',
        intro: '游戏开始时玩家可以更换一次手牌。',
        init: true
    }
};

var main = {
    dependencies: ['standard', 'maneuver'],
    ruleset: { card, player, stage, game, config }
};

export default main;
