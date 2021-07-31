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

function trigger(T) {
    return class Trigger extends T {
        /** Event name. */
        event;
        main() {
            // console.log('>', this.event, this.parent?.path)
        }
    };
}

function setup(T) {
    return class Setup extends T {
        main() {
            this.add('createPlayers');
            this.add('assignPeers');
            this.add('createCards');
        }
        /** Create all players and add to arena. */
        createPlayers() {
            // set total player number for arena
            const np = this.game.arena.np = this.game.config.np;
            const ids = [];
            for (let i = 0; i < np; i++) {
                const player = this.game.createPlayer();
                player.link.seat = i;
                ids.push(player.id);
            }
            this.game.arena.players = ids;
        }
        /** Assign clients to players. */
        assignPeers() {
        }
        /** Create card pile. */
        createCards() {
        }
    };
}

function loop(T) {
    return class Loop extends T {
        main() {
            console.log('loop');
        }
    };
}

function lobby(T) {
    return class Lobby extends T {
        lobby;
        main() {
            const lobby = this.lobby = this.game.create('lobby');
            // get names of hero packs and card packs
            const heropacks = {};
            const cardpacks = {};
            const configs = {};
            Object.assign(configs, this.game.mode.config);
            for (const name of this.game.packs) {
                const heropack = this.game.getExtension(name + ':heropack');
                const cardpack = this.game.getExtension(name + ':cardpack');
                if (heropack) {
                    heropacks[name] = heropack;
                }
                if (cardpack) {
                    cardpacks[name] = cardpack;
                }
            }
            // set default configurations
            for (const name in configs) {
                this.game.config[name] ??= configs[name].init;
            }
            // configuration for player number
            const np = this.game.mode.np;
            let npmax;
            if (typeof np === 'number') {
                this.game.config.np = np;
                npmax = np;
            }
            else {
                npmax = np[np.length - 1];
                configs.np = {
                    name: '游戏人数',
                    options: [],
                    init: npmax
                };
                for (const n of np) {
                    configs.np.options.push([n, `<span class="mono">${n}</span>人`]);
                }
                this.game.config.np ??= npmax;
            }
            // create lobby
            lobby.npmax = npmax;
            lobby.pane = { heropacks, cardpacks, configs };
            this.add('awaitStart');
            this.add('cleanUp');
        }
        /** Listen to configuration changes while awaiting game start. */
        awaitStart() {
            // monitor configuration change and await game start
            const lobby = this.lobby;
            lobby.owner = this.game.owner;
            lobby.mode = this.game.mode.extension;
            lobby.config = this.game.config;
            lobby.disabledHeropacks = Array.from(this.game.banned.heropacks);
            lobby.disabledCardpacks = Array.from(this.game.banned.cardpacks);
            this.monitor(lobby, 'updateLobby');
            this.await(lobby);
        }
        /** Update game configuration. */
        updateLobby([type, key, val]) {
            if (type === 'sync') {
                // game connected to or disconnected from hub
                this.game.config.online = val;
                this.lobby.config = this.game.config;
                // add callback for client operations
                const peers = this.game.getPeers();
                if (peers) {
                    for (const peer of peers) {
                        this.monitor(peer, 'updatePeer');
                    }
                }
            }
            else if (type === 'config') {
                if (key === 'online') {
                    // enable or disable multiplayer mode
                    if (val) {
                        this.game.hub.connect(val);
                    }
                    else {
                        this.game.hub.disconnect();
                    }
                }
                else {
                    // make sure np in range
                    if (key === 'np') {
                        const np = this.game.mode.np;
                        if (!Array.isArray(np) || val < np[0] || val > np[np.length - 1]) {
                            return;
                        }
                    }
                    // game configuration change
                    this.game.config[key] = val;
                    this.lobby.config = this.game.config;
                    // update seats in the lobby
                    if (key === 'np') {
                        const players = this.game.playerLinks;
                        if (players && players.length > val) {
                            for (let i = val; i < players.length; i++) {
                                players[i].playing = false;
                            }
                        }
                        this.game.hub.syncRoom();
                    }
                }
            }
            else if (type === 'hero') {
                // enable or disable a heropack
                this.game.banned.heropacks[val ? 'delete' : 'add'](key);
                this.lobby.disabledHeropacks = Array.from(this.game.banned.heropacks);
            }
            else if (type === 'card') {
                // enable or disable a cardpack
                this.game.banned.cardpacks[val ? 'delete' : 'add'](key);
                this.lobby.disabledCardpacks = Array.from(this.game.banned.cardpacks);
            }
        }
        /** Update info about joined players. */
        updatePeer(val, peer) {
            if (val === 'spectate' && peer.playing) {
                peer.playing = false;
                this.game.hub.syncRoom();
            }
            else if (val === 'play' && !peer.playing && this.game.playerLinks.length < this.game.config.np) {
                peer.playing = true;
                this.game.hub.syncRoom();
            }
        }
        /** Remove lobby and start game. */
        cleanUp() {
            // remove lobby and disable further configuration change
            this.lobby.unlink();
            this.game.start();
        }
    };
}

function choose(T) {
    return class Choose extends T {
        main() {
            console.log('choose', this.np);
        }
        select(key) {
        }
    };
}

function chooseHero(T) {
    return class ChooseHero extends T {
        main() {
            console.log('chooseHero', this.np, this.select);
        }
    };
}

function game(A) {
    return class Game extends A {
        players = [];
        cards = [];
        skills = [];
        backup() {
        }
        restore() {
        }
        createPlayer() {
            return this.createInstance('player', this);
        }
        createCard() {
            return this.createInstance('card', this);
        }
    };
}

function task(T) {
    return class Task extends T {
        test() {
            console.log('test1');
        }
    };
}

class Player {
    /** Game object. */
    game;
    /** Link to player component. */
    link;
    get id() {
        return this.link.id;
    }
    get owner() {
        return this.link.owner;
    }
    constructor(game) {
        this.game = game;
        this.link = game.create('player');
    }
}
const player = () => Player;

class Card {
}
const card = () => Card;

class Skill {
}
const skill = () => Skill;

var main = {
    mode: {
        np: 0,
        config,
        tasks: {
            trigger, setup, loop, lobby, choose, chooseHero
        },
        classes: {
            game, task, player, card, skill
        }
    }
};

export default main;
