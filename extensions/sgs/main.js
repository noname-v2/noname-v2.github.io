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
            this.add('assignSeat');
            this.add('takeSeat');
            this.add('createCards');
        }
        /** Create all players and add to arena. */
        createPlayers() {
            for (let i = 0; i < this.game.config.np; i++) {
                this.game.createPlayer().link.seat = i;
            }
        }
        /** Assign clients to players. */
        assignSeat() {
            const players = this.game.utils.rgets(this.game.players.values(), this.game.hub.players?.length || 1);
            const peers = this.game.hub.players;
            for (const player of players) {
                if (peers?.length) {
                    const peer = peers.pop();
                    player.link.owner = peer.owner;
                    player.link.nickname = peer.nickname;
                }
                else {
                    if (!peers) {
                        player.link.owner = this.game.owner;
                    }
                    break;
                }
            }
        }
        /** Update locations of players in arena. */
        takeSeat() {
            const ids = [];
            for (const player of this.game.players.values()) {
                console.log(player.link.seat, player.owner);
                ids.push(player.id);
            }
            this.game.arena.players = ids;
            this.game.arena.np = this.game.config.np;
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
            lobby.config.banned ??= {};
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
                const peers = this.game.hub.peers;
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
                        const players = this.game.hub.players;
                        if (players && players.length > val) {
                            for (let i = val; i < players.length; i++) {
                                players[i].playing = false;
                            }
                        }
                        this.game.hub.update();
                    }
                }
            }
            else if (type === 'banned') {
                const [section, name] = this.game.utils.split(key, '/');
                const set = new Set(this.game.config.banned[section]);
                set[val ? 'delete' : 'add'](name);
                if (set.size) {
                    this.game.config.banned[section] = Array.from(set);
                }
                else {
                    delete this.game.config.banned[section];
                }
                this.lobby.config = this.game.config;
            }
        }
        /** Update info about joined players. */
        updatePeer(val, peer) {
            if (val === 'spectate' && peer.playing) {
                peer.playing = false;
                this.game.hub.update();
            }
            else if (val === 'play' && !peer.playing && this.game.hub.players.length < this.game.config.np) {
                peer.playing = true;
                this.game.hub.update();
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

function createPop(T) {
    return class ChoosePop extends T {
        // player IDs and their pop contents
        pop;
        main() {
            console.log('choosePop', this.select);
        }
        test() {
        }
    };
}

function createHero(T) {
    return class ChoosePop extends T {
        main() {
            console.log('choosePop', this.pop, this.test, this.select);
        }
    };
}

function createTarget(T) {
    return class ChooseTarget extends T {
        // player IDs and their pop contents
        pop;
        main() {
            console.log('chooseTarget', this.select);
        }
        test2() {
        }
    };
}

function createChoose(T) {
    return class Choose extends T {
        main() {
            console.log('choose', this.np);
        }
        select(key) {
        }
    };
}
function choose(T) {
    const choose = createChoose(T);
    const choosePop = createPop(choose);
    const chooseTarget = createTarget(choose);
    const chooseHero = createHero(choosePop);
    return { choose, choosePop, chooseTarget, chooseHero };
}

function moveTo(T) {
    return class MoveTo extends T {
        main() {
            console.log('moveTo', this.np);
        }
    };
}

/** Game tasks. */
const tasks = {
    trigger, setup, loop, lobby,
    choose,
    moveTo
};

function game(A) {
    return class Game extends A {
        /** Map of all players, cards and skills. */
        players = new Map();
        cards = new Map();
        skills = new Map();
        backup() {
        }
        restore() {
        }
        createPlayer() {
            const player = this.createInstance('player', this, 'player');
            this.players.set(player.id, player);
            return player;
        }
        createCard() {
            const card = this.createInstance('card', this, 'card');
            this.cards.set(card.id, card);
            return card;
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

class Base {
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
    constructor(game, tag) {
        this.game = game;
        this.link = game.create(tag);
    }
}

class Player extends Base {
}
const player$1 = () => Player;

class Card extends Base {
}
const card = () => Card;

class Skill {
}
const skill = () => Skill;

const classes = {
    game, task, player: player$1, card, skill
};

function arena(T) {
    return class ArenaSGS extends T {
        /** Layout mode. */
        layout = 0;
        /** Player that is under control. */
        perspective = 0;
        /** Card container. */
        cards = this.ui.createElement('cards');
        /** Player container. */
        players = this.ui.createElement('players');
        /** Update arena layout. */
        resize(ax, ay, width, height) {
            const np = this.data.np;
            if (np) {
                if (np >= 7 && width / height < (18 + (np - 1) * 168) / 720) {
                    // wide 2-row layout
                    [ax, ay] = [900, 755];
                    this.layout = 1;
                }
                else {
                    // normal 3-row layout
                    if (np === 8) {
                        ax = 1194;
                    }
                    else {
                        ax = 1026;
                    }
                    ay = 620;
                    this.layout = 0;
                }
                // update player locations
                setTimeout(() => {
                    for (const id of this.data.players) {
                        this.getComponent(id).$seat();
                    }
                });
            }
            return [ax, ay];
        }
        // get location of a seat
        locatePlayer(seat) {
            // actual seat considering viewport
            const np = this.data.np;
            seat -= this.perspective;
            if (seat < 0) {
                seat += np;
            }
            const width = this.app.width;
            const height = this.app.height;
            if (this.layout === 1) {
                let dx1 = 25;
                let dx2 = (width - dx1 * 2 - 150 * (np - 3)) / (np - 4);
                if (dx2 < dx1) {
                    dx1 = dx2 = (width - 150 * (np - 3)) / (np - 2);
                }
                const dy = (height - 630) / 5;
                const xn = (n) => (150 + dx2) * n + dx1;
                const yn = (n) => (210 + dy) * n + dy * 2;
                if (np === 8) {
                    switch (seat) {
                        case 0: return [xn(0), yn(2)];
                        case 1: return [xn(4), yn(1)];
                        case 2: return [xn(4), yn(0)];
                        case 3: return [xn(3), dy];
                        case 4: return [xn(2), dy];
                        case 5: return [xn(1), dy];
                        case 6: return [xn(0), yn(0)];
                        case 7: return [xn(0), yn(1)];
                    }
                }
                else {
                    switch (seat) {
                        case 0: return [xn(0), yn(2)];
                        case 1: return [xn(3), yn(1)];
                        case 2: return [xn(3), yn(0)];
                        case 3: return [xn(2), dy];
                        case 4: return [xn(1), dy];
                        case 5: return [xn(0), yn(0)];
                        case 6: return [xn(0), yn(1)];
                    }
                }
            }
            else {
                let dx1 = 18;
                let dx2 = (width - dx1 * 2 - 1050) / 6;
                if (dx2 < dx1) {
                    dx1 = dx2 = (width - 1050) / 8;
                }
                if (np < 8) {
                    dx1 = 18;
                    dx2 = (width - dx1 * 2 - 900) / 5;
                    if (dx2 < dx1) {
                        dx1 = dx2 = (width - 900) / 7;
                    }
                }
                const dx3 = (width - dx1 * 2 - 150 * (np - 1)) / (np - 2);
                let dy1 = dx1;
                let dy2 = (height - dy1 * 3 - 420) / 2;
                if (dy2 <= 0 || dy1 / dy2 > 18 / 73) {
                    dy1 = (height - 420) / 200 * 18;
                    dy2 = (height - 420) / 200 * 73;
                }
                const xn0 = (n) => (150 + dx2) * n + dx1;
                const xn = (n) => (150 + dx3) * n + dx1;
                const yn = (n) => {
                    switch (n) {
                        case 0: return dy1;
                        case 1: return dy1 * 1.8;
                        case 2: return dy1 * 2 + dy2;
                        case 3: return dy1 * 2 + dy2 * 2 + 210;
                        case 4: return dy1 * 1.5 + dy2;
                        default: return 0;
                    }
                };
                switch (np) {
                    case 8: {
                        switch (seat) {
                            case 0: return [xn0(0), yn(3)];
                            case 1: return [xn0(6), yn(2)];
                            case 2: return [xn0(5), yn(1)];
                            case 3: return [xn0(4), yn(0)];
                            case 4: return [xn0(3), yn(0)];
                            case 5: return [xn0(2), yn(0)];
                            case 6: return [xn0(1), yn(1)];
                            case 7: return [xn0(0), yn(2)];
                        }
                    }
                    case 7: {
                        switch (seat) {
                            case 0: return [xn(0), yn(3)];
                            case 1: return [xn(5), yn(2)];
                            case 2: return [xn(4), yn(1)];
                            case 3: return [xn(3), yn(0)];
                            case 4: return [xn(2), yn(0)];
                            case 5: return [xn(1), yn(1)];
                            case 6: return [xn(0), yn(2)];
                        }
                    }
                    case 6: {
                        switch (seat) {
                            case 0: return [xn(0), yn(3)];
                            case 1: return [xn(4), yn(4)];
                            case 2: return [xn(3), yn(0)];
                            case 3: return [xn(2), yn(0)];
                            case 4: return [xn(1), yn(0)];
                            case 5: return [xn(0), yn(4)];
                        }
                    }
                    case 5: {
                        switch (seat) {
                            case 0: return [xn(0), yn(3)];
                            case 1: return [xn(3), yn(4)];
                            case 2: return [xn(2), yn(0)];
                            case 3: return [xn(1), yn(0)];
                            case 4: return [xn(0), yn(4)];
                        }
                    }
                    case 4: {
                        switch (seat) {
                            case 0: return [xn(0), yn(3)];
                            case 1: return [xn(2), yn(4)];
                            case 2: return [xn(1), yn(0)];
                            case 3: return [xn(0), yn(4)];
                        }
                    }
                    case 3: {
                        switch (seat) {
                            case 0: return [dx1, yn(3)];
                            case 1: return [width - dx1 - 150, yn(2)];
                            case 2: return [width / 2.5 - 150, yn(0)];
                        }
                    }
                    case 2: {
                        switch (seat) {
                            case 0: return [dx1, yn(3)];
                            case 1: return [width / 2 - 75, yn(0)];
                        }
                    }
                }
            }
            return [0, 0];
        }
        $np() {
            this.app.resize();
        }
        async $players(ids) {
            const nodes = new Set();
            // append players
            for (const id of ids) {
                const player = this.getComponent(id);
                nodes.add(player.node);
                if (player.node.parentNode !== this.players) {
                    this.players.appendChild(player.node);
                    this.ui.animate(this.players, { opacity: [0, 1] });
                }
                if (player.mine) {
                    this.perspective = player.data.seat;
                }
            }
            // remove players that no longer exist
            for (const node of this.players.childNodes) {
                if (!nodes.has(node)) {
                    node.remove();
                }
            }
            // append player region
            if (!this.players.parentNode) {
                this.arenaZoom.node.appendChild(this.players);
            }
        }
    };
}

function player(T) {
    return class PlayerSGS extends T {
        x;
        y;
        locate(dx = 0, dy = 0) {
            this.node.style.transform = `translate(${this.x + dx}px,${this.y + dy}px)`;
        }
        $seat(seat) {
            seat ??= this.data.seat;
            [this.x, this.y] = this.app.arena.locatePlayer(seat);
            this.locate();
        }
    };
}

const components = {
    arena, player
};

var main = {
    mode: {
        config,
        tasks,
        classes,
        components
    }
};

export default main;
