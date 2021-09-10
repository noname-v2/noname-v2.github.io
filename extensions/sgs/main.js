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

function createChoosePop(T) {
    return class ChoosePop extends T {
        /** Player IDs and their pop contents. */
        pop;
        /** Player IDs and created popups. */
        pops = new Map();
        /** Select configurations of players. */
        selects = new Map();
        main() {
            this.add('openDialog');
            this.add('getResults');
        }
        openDialog() {
            const timer = [this.getTimeout(), Date.now()];
            for (const [id, content] of this.pop) {
                const player = this.game.players.get(id);
                if (player?.owner) {
                    const pop = this.game.create('pop');
                    let order = 0;
                    pop.owner = player.owner;
                    pop.content = content;
                    pop.await(timer[0]);
                    pop.monitor('filter');
                    this.pops.set(pop, player.id);
                    if (timer[0]) {
                        pop.timer = timer;
                        player.link.timer = timer;
                    }
                    // get selection configurations from content
                    const sels = {};
                    for (const section of content) {
                        const sel = section[1];
                        if (sel && Array.isArray(sel.items)) {
                            sel.order = order++;
                            sels[section[0]] = sel;
                        }
                    }
                    this.selects.set(id, sels);
                }
            }
        }
        /** Process client return values. */
        getResults() {
            for (const id of this.pop.keys()) {
                const player = this.game.players.get(id);
                if (player?.link.timer) {
                    player.link.timer = null;
                }
            }
            for (const [pop, id] of this.pops) {
                // remove timers and close pop
                pop.timer = null;
                const player = this.game.players.get(id);
                if (player?.link.timer) {
                    player.link.timer = null;
                }
                pop.unlink();
                // // check selection
                // const sels = this.getSelect(pop);
                // console.log(pop.result);
                // console.log(this.checkSelection(pop.result, sels));
                // console.log(this.checkSelection({hero:pop.result.picked.slice(0, 2)}, sels));
            }
        }
        /** Get selectable items and send to client. */
        filter(selected, pop) {
            if (Array.isArray(selected)) {
                // custom operations defined by child classes
                try {
                    this[selected[0]](pop, ...selected.slice(1));
                }
                catch { }
            }
            else {
                // get selectable items
                const selectable = this.getSelectable(selected, this.selects.get(this.pops.get(pop)));
                pop.call('setSelectable', selectable);
            }
        }
    };
}

function createHero(T) {
    return class ChoosePop extends T {
        heros;
        pick = false;
        main() {
            this.pop = new Map();
            for (const [id, heros] of this.heros) {
                const confirm = ['ok'];
                if (!this.forced) {
                    confirm.push('cancel');
                }
                if (this.pick) {
                    confirm.push(['callPick', '点将']);
                }
                this.pop.set(id, [
                    ['caption', '选择武将'],
                    ['hero', heros],
                    ['confirm', confirm]
                ]);
            }
            super.main();
            this.add('dispatchPick');
        }
        /** Dispatch user-picked heros. */
        dispatchPick() {
            for (const [pop, id] of this.pops) {
                // check selection
                const sels = this.selects.get(id);
                console.log(pop.result);
                console.log(this.checkSelection(pop.result, sels));
                console.log(this.checkSelection({ hero: pop.result.picked.slice(0, 2) }, sels));
            }
        }
        /** Callback when user clicks pick button. */
        callPick(pop, e) {
            if (this.game.hub.connected) {
                pop.call('togglePick');
            }
            else {
                pop.call('pick', [e, this.game.heropacks]);
            }
        }
    };
}

function createChoosePlayer(T) {
    return class ChoosePlayer extends T {
        main() {
            console.log('choosePlayer', this.select);
        }
        test2() {
        }
    };
}

function createChoose(T) {
    return class Choose extends T {
        /** Has time limit. */
        timeout = null;
        /** Allow not choosing. */
        forced = false;
        /** Time limit for choosing. */
        getTimeout() {
            if (this.timeout === null && this.game.hub.connected) {
                return this.game.config.timeout ?? null;
            }
            return this.timeout;
        }
        /** Get a list of selectable items. */
        getSelectable(selected, sels) {
            const selectable = [];
            for (const section in sels) {
                const filter = this.game.createFilter(section, selected, sels, this);
                try {
                    for (const item of sels[section].items) {
                        if (filter(item)) {
                            selectable.push(item);
                        }
                    }
                }
                catch {
                    return [];
                }
            }
            return selectable;
        }
        /** Check if selected items are legal. */
        checkSelection(selected, sels) {
            // fake selected items
            const current = {};
            for (const section in sels) {
                current[section] = [];
            }
            // get section order
            const order = Object.keys(sels);
            order.sort((a, b) => (sels[a].order - sels[b].order));
            for (const section of order) {
                // check number of selected items
                const n = selected[section].length;
                const sel = sels[section];
                if (typeof sel.num === 'number') {
                    if (n !== sel.num) {
                        return false;
                    }
                }
                else if (Array.isArray(sel.num)) {
                    if (n < sel.num[0] || n > sel.num[1]) {
                        return false;
                    }
                }
                // check if selected items satisfy filter
                const filter = this.game.createFilter(section, current, sels, this);
                for (const item of selected[section]) {
                    if (!filter(item)) {
                        return false;
                    }
                    current[section].push(item);
                }
            }
            return true;
        }
    };
}
function choose(T) {
    // abstract base class
    const choose = createChoose(T);
    // choose from a popup dialog
    const choosePop = createChoosePop(choose);
    // choose players and / or cards
    const choosePlayer = createChoosePlayer(choose);
    // choose from a list of heros
    const chooseHero = createHero(choosePop);
    return { choose, choosePop, choosePlayer, chooseHero };
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
    trigger, setup, loop,
    choose,
    moveTo
};

function game(G) {
    return class Game extends G {
        /** Map of all players, cards and skills. */
        players = new Map();
        cards = new Map();
        skills = new Map();
        /** Backup game progress. */
        backup() {
        }
        /** Restore game progress. */
        restore() {
        }
        /** Create a new player. */
        createPlayer() {
            const player = this.createInstance('player', this, 'player');
            this.players.set(player.id, player);
            return player;
        }
        /** Create a new card. */
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
        return this.link.owner ?? null;
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
    return class Arena extends T {
        /** Blur arena on start. */
        initBlur = true;
        /** Layout mode. */
        layout = 0;
        /** Player that is under control. */
        perspective = 0;
        /** Card container. */
        cards = this.ui.createElement('cards');
        /** Player container. */
        players = this.ui.createElement('players');
        init() {
            super.init();
            if (this.initBlur) {
                this.arenaZoom.node.classList.add('blurred');
            }
        }
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
            const width = this.arenaZoom.width;
            const height = this.arenaZoom.height;
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
                this.ui.animate(this.players, { scale: ['var(--app-zoom-scale)', 1] });
            }
        }
    };
}

function player(T) {
    return class Player extends T {
        x;
        y;
        locate(dx = 0, dy = 0) {
            this.node.style.transform = `translate(${this.x + dx}px,${this.y + dy}px)`;
        }
        $seat(seat) {
            seat ??= this.data.seat;
            [this.x, this.y] = this.app.arena.locatePlayer(seat);
            this.locate();
            if (!this.data.heroName) {
                this.$heroName(`@(${seat + 1})号位`);
            }
        }
    };
}

function pop(T) {
    return class Pop extends T {
        /** Selected by this.pick(). */
        picked = new Set();
        /** Item clones created by this.pick(). */
        clones = new Map();
        /** Cache of created collections. */
        collections = new Map();
        /** Restored picked heros from db. */
        #restored = false;
        /** ID in db for saving. */
        get #id() {
            const arena = this.app.arena;
            return arena.data.mode + ':' + (arena.data.peers ? 'online_picked' : 'picked');
        }
        /** Include picked items. */
        ok() {
            if (this.picked.size) {
                this.respond([this.selected, this.picked]);
            }
            else {
                super.ok();
            }
        }
        /** Include picked items. */
        getSelected() {
            // original selected items
            const selected = {};
            Object.assign(selected, super.getSelected());
            // add picked items
            const picked = Array.from(this.picked);
            picked.sort((a, b) => {
                const idx = (id) => this.tray.items.get(this.clones.get(id)) ?? -1;
                return idx(b) - idx(a);
            });
            selected.picked = picked;
            return selected;
        }
        /** Enable pick by default. */
        addConfirm(confirm) {
            super.addConfirm(confirm);
            if (this.app.connected && this.buttons.get('callPick')) {
                this.tray.ready.then(() => this.#restore());
            }
        }
        /** Enable or disable pick. */
        togglePick() {
            if (this.mine) {
                const button = this.buttons.get('callPick');
                if (button.dataset.fill) {
                    this.#clear();
                }
                else {
                    this.#restore();
                }
            }
        }
        /** Open a popup to pick heros. */
        pick([e, packs]) {
            if (!this.mine || this.#restore()) {
                return;
            }
            const menu = this.ui.create('popup');
            for (const pack of packs) {
                // separate by packs to improve performance
                const name = this.app.accessExtension(pack, 'heropack');
                menu.pane.addOption(name ?? pack, () => {
                    // open hero gallery
                    menu.close();
                    if (!this.collections.has(pack)) {
                        this.#createCollection(pack);
                    }
                    this.collections.get(pack).pop();
                });
            }
            // cancel this.#restore
            if (this.picked.size) {
                menu.pane.addOption('取消', () => {
                    this.#clear();
                    menu.close();
                });
            }
            menu.open(e);
        }
        /** Save picked heros. */
        #save() {
            this.db.set(this.#id, Array.from(this.picked));
            this.buttons.get('callPick').dataset.fill = this.picked.size ? 'blue' : '';
        }
        /** Clear picked items. */
        #clear() {
            for (const id of this.picked) {
                this.tray.deleteSilent(this.clones.get(id));
            }
            this.tray.align();
            this.picked.clear();
            this.buttons.get('callPick').dataset.fill = '';
            this.#restored = false;
        }
        /** Restore from saved heros. */
        #restore() {
            if (this.#restored) {
                return false;
            }
            this.#restored = true;
            const picked = this.db.get(this.#id) ?? [];
            if (picked.length) {
                for (const id of picked) {
                    this.#pick(id);
                    const clone = this.clones.get(id);
                    this.tray.addSilent(clone);
                }
                this.tray.align();
                this.buttons.get('callPick').dataset.fill = 'blue';
                return true;
            }
            else {
                return false;
            }
        }
        /** Pick an item. */
        #pick(id) {
            if (!this.clones.has(id)) {
                const clone = this.ui.createElement('widget.avatar');
                clone.dataset.shadow = 'blue';
                this.app.bindHero(clone, id);
                this.ui.setImage(clone, id);
                let clicked = false;
                this.ui.bind(clone, () => {
                    if (clicked || this.app.connected) {
                        return;
                    }
                    clicked = true;
                    setTimeout(() => clicked = false, 500);
                    this.#unpick(id);
                });
                this.clones.set(id, clone);
            }
            // select hero
            this.picked.add(id);
        }
        /** Unpick an item. */
        #unpick(id) {
            this.picked.delete(id);
            this.tray.delete(this.clones.get(id));
            this.#save();
        }
        /** Create a hero collection of an extension. */
        #createCollection(pack) {
            const collection = this.ui.create('collection');
            collection.nrows = 3;
            collection.ncols = 7;
            collection.setup([pack], 'hero', (id, node) => {
                if (this.picked.has(id)) {
                    node.classList.add('selected');
                }
                this.ui.bind(node, () => {
                    if (this.picked.has(id)) {
                        // unselect hero
                        this.#unpick(id);
                        node.classList.remove('selected');
                    }
                    else if (!node.classList.contains('selected')) {
                        // create clone of hero
                        this.#pick(id);
                        this.tray.add(this.clones.get(id));
                        this.#save();
                        node.classList.add('selected');
                    }
                });
            });
            this.collections.set(pack, collection);
            // check if hero is picked
            collection.onopen = () => {
                for (const [id, node] of collection.items) {
                    node.classList[this.picked.has(id) ? 'add' : 'remove']('selected');
                }
            };
        }
    };
}

const components = {
    arena, player, pop
};

var main = {
    requires: ['standard', 'maneuver'],
    mode: {
        tasks, classes, components,
        minHeroCount: 50,
        minPileCount: 100,
        autoKeywords: {
            hero: 'steel',
            card: 'gold',
            skill: 'orange'
        },
        config: {
            online: {
                name: '联机模式',
                intro: '允许其他玩家通过主页的联机键加入游戏。',
                init: false
            },
            timeout: {
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
            mulligan: {
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
            infinite_mulligan: {
                name: '手气卡',
                intro: '游戏开始时玩家可以更换任意次手牌。',
                init: false,
                requires: '!online'
            },
            pick: {
                name: '点将',
                intro: '点击左侧武将包名称进行点将。可多选，优选择最左边的武将，若有多名玩家点同一武将导致点将失败，则会选择向右一名的武将，直到点将成功。',
                init: false,
                requires: 'online'
            },
            speed: {
                name: '游戏速度',
                intro: '控制游戏事件间的间隔时间。',
                init: 0.3,
                options: [
                    [0.5, '较慢'],
                    [0.3, '正常'],
                    [0.15, '较快']
                ]
            }
        }
    },
    lib: {
        faction: {
            'wei': ['魏', 'doger'],
            'shu': ['蜀', 'brown'],
            'wu': ['吴', 'green'],
            'qun': ['群', 'rod']
        },
        keyword: {
            '主公技': ['只有身份为主公时才可以发动', 'red'],
            '锁定技': ['技能于其发动时机若能发动则必须发动', 'sky'],
            '限定技': ['技能于一局游戏内只能发动一次', 'purple'],
            '觉醒技': ['① 技能于其发动时机若能发动则必须发动；② 技能于一局游戏内只能发动一次', 'aqua']
        },
        type: {
            'basic': '基本',
            'trick': '锦囊',
            'equip': '装备'
        },
        subtype: {
            'equip.weapon': '武器',
            'equip.armor': '防具',
            'equip.mount': '坐骑',
            'trick.instant': '普通锦囊',
            'trick.delayed': '延时锦囊'
        }
    }
};

export default main;
