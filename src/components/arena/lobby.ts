import { hub } from '../../client/client';
import { splash } from '../../client/globals';
import { Component, Toggle, Player, Tray, Collection, Dialog } from '../../components/component';
import type { Config, Dict } from '../../types';

export class Lobby extends Component {
    /** Sidebar for configurations. */
    sidebar = this.ui.create('sidebar', this.node);

    /** Player seats. */
    seats = this.ui.createElement('seats', this.node);

    /** Collection background. */
    collectionBackground = this.ui.createElement('background', this.node);

    /** Toggles for mode configuration. */
    configToggles = new Map<string, Toggle>();

    /** Toggles that show or hide based on other toggles. */
    configDynamicToggles = new Map<string, string>();

    /** Toggles for hero packs. */
    heroToggles = new Map<string, Toggle>();

    /** Toggles for card packs. */
    cardToggles = new Map<string, Toggle>();

    /** Trying to connect to server. */
    connecting = false;

    /** Players in this seats. */
    players: Player[] = [];

    /** Button to toggle spectating. */
    spectateButton = this.ui.createElement('widget.button');

    /** Container of spectators. */
    spectateBar = this.ui.createElement('bar');

    /** Sections containing banned heros. */
    banned!: [HTMLElement, Tray, Map<string, HTMLElement>];

    /** Sections containing banned heros. */
    picked!: [HTMLElement, Tray, Map<string, HTMLElement>, boolean];

    /** Map of hero buttons in collection. */
    heroButtons = new Map<string, HTMLElement>();

    /** Map of hero buttons in mega collection. */
    megaHeroButtons = new Map<string, HTMLElement>();

    /** Cache of collections. */
    collections = new Map<string, Collection>();

    /** Start game button is clicked and awaiting start. */
    #starting = 0;

    /** Number of temporary collections. */
    #tmpCount = 0;

    /** Whether pick tray contains online of offline heros. */
    #pickMode!: boolean;

    /** ID in db for configuration. */
    get #config() {
        return this.app.mode + ':' + (this.app.connected ? 'online_' : '') + 'config';
    }

    /** ID in db for picked heros. */
    get #pick() {
        return this.app.mode + ':' + (this.app.connected ? 'online_' : '') + 'picked';
    }

    init() {
        const arena = this.app.arena!;
        arena.appZoom.node.appendChild(this.node);
        this.listen('sync');
        this.sidebar.ready.then(() => {
            this.sidebar.setHeader('返回', () => arena.back());
        });

        this.sidebar.pane.node.classList.add('fixed');
        this.ui.animate(this.sidebar.node, {x: [-220, 0]});
        this.ui.animate(this.seats, {scale: ['var(--app-zoom-scale)', 1], opacity: [0, 1]});
    }

    /** Update connected players. */
    sync() {
        const peers = this.app.arena!.peers;
        
        // callback for online mode toggle
        if (this.mine) {
            this.yield(['sync', null, [peers ? true : false, this.db.get(this.#config) || {}]]);
            if (this.connecting && !peers) {
                this.app.alert('连接失败');
            }
            this.connecting = false;
            const toggle = this.configToggles.get('online');
            if (toggle) {
                if (peers && peers.length > 1) {
                    toggle.confirm.set(false, ['联机模式', '当前房间有其他玩家，关闭后将断开连接并请出所有其他玩家，确定关闭联机模式？']);
                }
                else {
                    toggle.confirm.delete(false);
                }
            }
        }

        // update seats
        const players = [];
        const spectators = [];
        for (const peer of peers || []) {
            if (peer.data.playing) {
                players.push(peer);
            }
            else {
                spectators.push(peer);
            }
        }

        for (let i = 0; i < this.players.length; i++) {
            if (i < players.length) {
                const peer = players[i]!;
                this.players[i].data.heroImage = peer.data.avatar;
                this.players[i].data.heroName = peer.data.nickname;
                if (peer.owner === this.owner) {
                    this.players[i].data.marker = peer.data.ready ? '准备开始' : '房主';
                    this.players[i].marker.dataset.tglow = peer.data.ready ? 'orange' : 'doger';
                    this.players[i].data.timer = peer.data.ready || null;
                }
                else {
                    this.players[i].data.marker = peer.data.ready ? '已准备' : '';
                    this.players[i].marker.dataset.tglow = 'green';
                }
            }
            else {
                this.players[i].data.heroImage = null;
                this.players[i].data.heroName = null;
                this.players[i].data.marker = null;
            }
        }

        // update spectate button
        const peer = this.app.arena!.peer;
        if (peer) {
            this.seats.classList.remove('offline');
            this.spectateButton.dataset.fill = peer.data.playing ? '' : 'red';
            this.#alignAvatars(spectators.map(peer => peer.data.avatar));
            this.#checkSpectate();
        }
        else {
            this.seats.classList.add('offline');
        }

        // update footer
        if (!this.mine) {
            const peer = this.app.arena!.peer!;
            if (peer.data.ready) {
                (this.sidebar.footer.firstChild as HTMLElement).innerHTML = '取消准备';
            }
            else {
                (this.sidebar.footer.firstChild as HTMLElement).innerHTML = '准备';
            }
        }

        // check if all players are ready
        if (this.#starting && this.#checkPrepare()) {
            clearInterval(this.#starting);
            this.#starting = 0;
            this.respond();
            this.app.popups.get('lobbyReady')?.close();
        }

        // update picked heros
        this.#updatePicks();
    }

    /** Disable all toggles until command received from worker. */
    freeze() {
        this.sidebar.pane.node.classList.add('pending');
    }

    /** Re-enable toggles. */
    unfreeze() {
        this.sidebar.pane.node.classList.remove('pending');
    }

    /** Check if there's enough heros and cards to start game. */
    checkStart([h1, h2, c1, c2]: number[]) {
        if (this.mine) {
            if (h1 > h2) {
                this.app.alert('无法开始', {content: `武将数量不足（<span class="mono">${h2}/${h1}</span>）。`});
            }
            else if (c1 > c2) {
                this.app.alert('无法开始', {content: `牌堆数量不足（<span class="mono">${c2}/${c1}</span>）。`});
            }
            else if (this.#checkPrepare()) {
                this.respond();
            }
            else {
                if (this.#starting) return;
                this.app.alert('开始', {ok: '取消', id: 'lobbyReady'}).then(() => {
                    clearInterval(this.#starting);
                    this.#starting = 0;
                    this.app.arena!.peer!.yield('unprepare');
                });
                this.app.arena!.peer!.yield('prepare');
                const dialog = this.app.popups.get('lobbyReady') as Dialog;
                let n = 15;
                const update = () => {
                    dialog.data.content = `有玩家尚未准备，<span class="mono">${n}</span>秒后游戏将无视未准备玩家并开始游戏。`;
                    if (--n === 0) {
                        clearInterval(this.#starting);
                        this.#starting = 0;
                        this.respond();
                        dialog.close();
                    }
                };
                update();
                this.#starting = window.setInterval(update, 1000);
            }
        }
    }

    /** Remove with fade and slide animation. */
    remove() {
        if (this.removing) {
            return;
        }
        
        super.remove(new Promise<void>(resolve => {
            let done = 0;
            const onfinish = () => {
                if (++done === 2) {
                    resolve();
                }
            }

            let slide = true;
            for (const popup of this.collections.values()) {
                if (!popup.hidden) {
                    done++;
                    slide = false;
                    break;
                }
            }
            if (slide) {
                this.ui.animate(this.sidebar.node, {x: [0, -220]}, {fill: 'forwards'}).onfinish = onfinish;
                this.ui.animate(this.seats, {opacity: [1, 0]}, {fill: 'forwards'}).onfinish = onfinish;
            }
            else {
                this.ui.animate(this.node, {opacity: [1, 0]}, {fill: 'forwards'}).onfinish = onfinish;
            }
        }));

        for (const popup of this.collections.values()) {
            popup.close();
        }
    }

    $pane(configs: {heropacks: string[], cardpacks: string[], configs: Dict<Config>}) {
        // mode options
        const settingsSection = this.sidebar.pane.addSection('选项');
        this.ui.bind(settingsSection, () => {
            splash.settings.open();
        });
        for (const name in configs.configs) {
            const config = configs.configs[name];
            const caption = config.intro ? [config.name, config.intro] : config.name;
            const toggle = this.sidebar.pane.addToggle(caption as any, result => {
                this.freeze();
                if (name === 'online' && result) {
                    this.connecting = true;
                    this.yield(['config', name, hub.url]);
                }
                else {
                    this.yield(['config', name, result]);
                }
            }, config.options!);
            if (config.confirm) {
                for (const [key, val] of config.confirm) {
                    toggle.confirm.set(key, val);
                }
            }
            if (config.requires) {
                this.configDynamicToggles.set(name, config.requires);
            }
            this.configToggles.set(name, toggle);
        }

        // heropacks
        const heroSection = this.sidebar.pane.addSection('武将');
        const heropacks: string[] = [];
        for (const pack of configs.heropacks) {
            heropacks.push(pack);
            const name = this.app.accessExtension(pack, 'heropack');
            const toggle = this.sidebar.pane.addToggle([
                name, () => this.#openCollection(pack, 'hero')
            ], result => {
                this.freeze();
                this.yield(['banned', 'heropack/' + pack, result]);
            });
            this.heroToggles.set(pack, toggle);
        }
        this.ui.bindClick(heroSection, () => this.#openCollection(heropacks, 'hero'))
        
        // cardpacks
        const cardSection = this.sidebar.pane.addSection('卡牌');
        const cardpacks: string[] = [];
        for (const pack of configs.cardpacks) {
            cardpacks.push(pack);
            const name = this.app.accessExtension(pack, 'cardpack');
            const toggle = this.sidebar.pane.addToggle([
                name, () => this.#openCollection(pack, 'card+pile')
            ], result => {
                this.freeze();
                this.yield(['banned', 'cardpack/' + pack, result]);
            });
            this.cardToggles.set(pack, toggle);
        }
        this.ui.bindClick(cardSection, () => this.#openCollection(cardpacks, 'card+pile'))

        // picked heros
        this.picked = [
            this.sidebar.pane.addSection('点将'),
            this.sidebar.pane.addTray('round'),
            new Map(), false
        ];

        this.picked[0].style.display = 'none';
        this.picked[1].node.style.display = 'none';
        this.ui.bind(this.picked[1].node, () => this.#openCollection(heropacks, 'hero'));
        this.ui.bindClick(this.picked[0], () => this.#showPicked());

        // banned heros
        this.banned = [
            this.sidebar.pane.addSection('禁将'),
            this.sidebar.pane.addTray('round'),
            new Map()
        ];
        this.banned[0].style.display = 'none';
        this.banned[1].node.style.display = 'none';
        this.ui.bind(this.banned[1].node, () => this.mine ? this.#openCollection(heropacks, 'hero') : null);
        this.ui.bindClick(this.banned[0], () => this.#showBanned());
    }

    $owner() {
        this.sidebar.pane.node.classList[this.mine ? 'remove' : 'add']('fixed');
        this.sidebar[this.mine ? 'showFooter' : 'hideFooter']();
        if (this.mine) {
            this.sidebar.ready.then(() => this.sidebar.setFooter('开始游戏', () => this.yield(['start'])));
            this.yield(['sync', null, [false, this.db.get(this.#config) || {}]]);
        }
        else {
            this.sidebar.footer.classList.add('alter');
            this.sidebar.ready.then(() => this.sidebar.setFooter('准备', () => {
                const peer = this.app.arena!.peer!;
                if (peer.data.ready) {
                    peer.yield('unprepare');
                }
                else {
                    peer.yield('prepare');
                }
            }));
        }
        this.sidebar.showFooter();
    }

    $config(config: Dict, _: Dict, partial: boolean) {
        this.unfreeze();

        // update toggles
        for (const [key, toggle] of this.configToggles) {
            if (key in config) {
                toggle.assign(config[key]);

                // hide a toggle if its dependency is not present
                let requires = this.configDynamicToggles.get(key);
                if (requires) {
                    const not = requires[0] === '!';
                    if (not) {
                        requires = requires.slice(1);
                    }
                    if (!partial || requires in config) {
                        const hide = not ? config[requires] : !config[requires];
                        toggle.node.style.display = hide ? 'none' : '';
                    }
                }
            }
            else if (!partial) {
                toggle.node.style.display = 'none';
            }
        }

        // update spectators
        if ('np' in config) {
            // make sure npmax is set
            setTimeout(() => {
                for (let i = 0; i < this.data.npmax; i++) {
                    this.players[i].node.classList[i < config.np ? 'remove' : 'add']('blurred');
                }
                this.#checkSpectate();
            });
        }

        // update banned packs
        if (!partial || config.banned?.heropack) {
            for (const [name, toggle] of this.heroToggles) {
                toggle.assign(config.banned?.heropack?.includes(name) ? false : true);
            }
            if (config.banned?.heropack?.length === 0) {
                delete config.banned.heropack;
            }
        }
        
        if (!partial || config.banned?.cardpack) {
            for (const [name, toggle] of this.cardToggles) {
                toggle.assign(config.banned?.cardpack?.includes(name) ? false : true);
            }
            if (config.banned?.cardpack?.length === 0) {
                delete config.banned.cardpack;
            }
        }

        // update banned hero
        if (!partial || config.banned?.hero) {
            const oldBanned = new Set<string>();
            const newBanned = new Set<string>(config.banned?.hero);
            const tray = this.banned[1];

            if (newBanned.size) {
                this.banned[0].style.display = '';
                tray.node.style.display = '';

                // get existing tray items
                for (const [id, clone] of this.banned[2]) {
                    if (tray.items.has(clone)) {
                        oldBanned.add(id);
                    }
                }
                
                // add new banned
                for (const id of newBanned) {
                    if (!oldBanned.has(id)) {
                        if (!this.banned[2].has(id)) {
                            const clone = this.ui.createElement('widget.avatar');
                            this.ui.setImage(clone, id);
                            this.ui.bind(clone, () => this.#showBanned());
                            this.app.bindHero(clone, id);
                            this.banned[2].set(id, clone);
                        }

                        this.heroButtons.get(id)?.classList.add('defer');
                        this.megaHeroButtons.get(id)?.classList.add('defer');
                        tray.addSilent(this.banned[2].get(id)!);
                    }
                }
                
                // remove old banned
                for (const id of oldBanned) {
                    if (!newBanned.has(id)) {
                        this.heroButtons.get(id)?.classList.remove('defer');
                        this.megaHeroButtons.get(id)?.classList.remove('defer');
                        tray.deleteSilent(this.banned[2].get(id)!);
                    }
                }

                tray.align();
            }
            else {
                this.banned[0].style.display = 'none';
                this.banned[1].node.style.display = 'none';
                tray.items.clear();
                tray.node.innerHTML = '';
                delete config.banned.hero;
            }
        }

        // update picked hero
        if (!partial || 'pick' in config) {
            if (this.data.config.pick || !this.app.arena!.peers) {
                this.picked[0].style.display = '';
                this.picked[1].node.style.display = '';
                if (!this.picked[3]) {
                    this.picked[3] = true;
                    this.picked[1].align();
                }
                for (const collection of this.collections.values()) {
                    collection.node.classList.remove('no-select');
                }
            }
            else {
                this.picked[0].style.display = 'none';
                this.picked[1].node.style.display = 'none';
                for (const collection of this.collections.values()) {
                    collection.node.classList.add('no-select');
                }
            }
            if (!partial) {
                this.#updatePicks();
            }
        }

        // save configuration
        if (this.mine) {
            const config = this.data.config;
            delete config.online;
            this.db.set(this.#config, config);
        }
    }

    $npmax(npmax: number) {
        // add player seats
        this.seats.innerHTML = '';
        this.players.length = 0;
        for (let i = 0; i < npmax; i++) {
            if (npmax > 4 && i === Math.ceil(npmax / 2)) {
                this.seats.appendChild(document.createElement('div'));
            }
            const player = this.ui.create('player');
            this.players.push(player);
            this.seats.appendChild(player.node);
            this.ui.bind(player.node, () => {
                if (!this.mine) {
                    return;
                }
                const toggle = this.configToggles.get('np');
                if (toggle) {
                    const nps = Array.from(toggle.choices!.keys());
                    const idx = nps.indexOf(this.data.config.np);
                    const delta = player.node.classList.contains('blurred') ? 1 : -1;
                    const np = nps[idx + delta];
                    if (typeof np === 'number') {
                        this.yield(['config', 'np', np]);
                    }
                }
            });
        }
        if (npmax > 4) {
            this.seats.classList.add('two-rows');
        }
        else {
            this.seats.classList.remove('two-rows');
        }

        // buttons below the seats
        const div = document.createElement('div');
        div.classList.add('bar');
        this.seats.appendChild(div);
        this.seats.classList.add('offline');
        this.seats.appendChild(this.spectateBar);
        this.spectateBar.appendChild(this.spectateButton);
        this.spectateButton.innerHTML = '旁观';
        
        // toggle between spectator and player
        this.ui.bind(this.spectateButton, () => {
            if (this.spectateButton.dataset.fill === 'red') {
                this.app.arena!.peer!.yield('play');
            }
            else {
                this.app.arena!.peer!.yield('spectate');
            }
        });
    }

    /** Calculate the location of spectators and specified heros. */
    #alignAvatars(names: string[]) {
        const frag = document.createDocumentFragment();
        frag.appendChild(this.spectateButton);
        const n = names.length;
        for (let i = 0; i < n; i++) {
            const img = this.ui.createElement('image.avatar');
            this.ui.setImage(img, names[i]);
            if (n > 10) {
                img.style.marginRight = `${560 / n - 40}px`;
            }
            frag.appendChild(img);
        }
        (this.spectateBar as any).replaceChildren(frag);
    }

    /** Enable or disable spectate button. */
    #checkSpectate() {
        if (!this.spectateButton.dataset.fill) {
            this.spectateButton.classList.remove('disabled');
        }
        else {
            const np = this.data.config.np;
            let n = 0;
            for (const player of this.players) {
                if (player.data.heroName) {
                    n++;
                }
            }
            this.spectateButton.classList[n < np ? 'remove' : 'add']('disabled');
        }
    }

    #checkPrepare() {
        for (const peer of this.app.arena!.peers || []) {
            if (!peer.mine && peer.data.playing && !peer.data.ready) {
                return false;
            }
        }
        return true;
    }

    #togglePick(id: string, on: boolean, save: boolean = true) {
        const picked = new Set(this.db.get(this.#pick));
        picked[on ? 'add' : 'delete'](id);
        if (save) {
            this.db.set(this.#pick, picked.size ? Array.from(picked) : null);
        }
        this.heroButtons.get(id)?.classList[on ? 'add' : 'remove']('selected');
        this.megaHeroButtons.get(id)?.classList[on ? 'add' : 'remove']('selected');

        if (!this.picked[2].has(id)) {
            const clone = this.ui.createElement('widget.avatar');
            this.ui.setImage(clone, id);
            this.ui.bind(clone, () => this.#showPicked());
            this.app.bindHero(clone, id);
            this.picked[2].set(id, clone);
        }

        const clone = this.picked[2].get(id)!;
        if (save) {
            this.picked[1][on ? 'add' : 'delete'](clone);
        }
        else {
            this.picked[1][on ? 'addSilent' : 'deleteSilent'](clone);
        }
    }

    #createCollection(tmp: string | null = null) {
        const collection = this.ui.create('collection');
        collection.arena = true;
        collection.flex = true;
        collection.ready.then(() => {
            this.ui.bind(collection.pane.node, () => collection.close());
        });

        // ID for temporary collection
        let id = '';
        if (tmp) {
            id = `${tmp}:${++this.#tmpCount}`;
            this.collections.set(id, collection);
        }

        // open animation
        collection.onopen = () => {
            let node: HTMLElement;
            for (const popup of this.collections.values()) {
                if (popup !== collection) {
                    popup.close();
                }
            }
            this.node.classList.add('collection');
            if (collection.pileToggle?.dataset.fill) {
                collection.pileGallery?.checkPage();
                node = collection.pileGallery?.pages!;
            }
            else {
                collection.gallery.checkPage();
                node = collection.gallery.pages;
            }
            if (node) {
                this.ui.animate(node, {scale: ['var(--pop-transform)', 1]});
            }
        };

        // close animation
        collection.onclose = () => {
            this.node.classList.remove('collection');
            if (this.removing) {
                return;
            }
            for (const popup of this.collections.values()) {
                if (!popup.hidden) {
                    return;
                }
            }
            let node: HTMLElement;
            if (collection.pileToggle?.dataset.fill) {
                node = collection.pileGallery?.pages!;
            }
            else {
                node = collection.gallery.pages;
            }
            if (node) {
                this.ui.animate(node, {scale: [1, 'var(--pop-transform)']});
            }

            if (id) {
                this.collections.delete(id);
            }
        };

        if (!this.data.config.pick && this.app.arena!.peers) {
            collection.node.classList.add('no-select');
        }

        return collection;
    }

    #openCollection(packs: string | string[], type: 'hero' | 'card+pile') {
        let id: string;
        let mega = false;
        if (typeof packs === 'string') {
            id = type + '|' + packs;
            packs = [packs];
        }
        else {
            id = 'mega:' + type;
            mega = true;
        }
        if (!this.collections.has(id)) {
            const collection = this.#createCollection();
            collection.setup(packs, type, (id, node) => {
                if (type === 'hero') {
                    this.ui.bind(node, () => {
                        if (this.mine) {
                            if (this.data.config.pick || !this.app.arena!.peers) {
                                const picked = node.classList.contains('selected');
                                const banned = node.classList.contains('defer');
                                this.app.choose(this.app.getInfo('hero', id).name, {
                                    buttons: [
                                        ['pick', '点将', picked ? 'red' : ''],
                                        ['ban', '禁用', banned ? 'blue' : '']
                                    ],
                                    temp: true
                                }).then(item => {
                                    if (item === 'pick') {
                                        this.#togglePick(id, !picked);
                                    }
                                    else if (item === 'ban') {
                                        this.yield(['banned', 'hero/' + id, banned]);
                                    }
                                });
                            }
                            else {
                                this.yield(['banned', 'hero/' + id, node.classList.contains('defer')]);
                            }
                        }
                        else if (this.data.config.pick && this.app.arena!.peers) {
                            this.#togglePick(id, !node.classList.contains('selected'));
                        }
                    });

                    if (mega) {
                        this.megaHeroButtons.set(id, node);
                    }
                    else {
                        this.heroButtons.set(id, node);
                    }

                    if (this.data.config?.banned?.hero?.includes(id)) {
                        node.classList.add('defer');
                    }
                    if (this.db.get(this.#pick)?.includes(id)) {
                        node.classList.add('selected');
                    }
                }
            });
            this.collections.set(id, collection);
        }
        const collection = this.collections.get(id)!;
        collection[collection.hidden ? 'open' : 'close']();
    }

    #showBanned() {
        for (const [id, collection] of this.collections) {
            if (!collection.hidden) {
                if (id.startsWith('ban:')) {
                    collection.close();
                    return;
                }
                break;
            }
        }
        const collection = this.#createCollection('ban');
        const heros = [];
        for (const [id, clone] of this.banned[2]) {
            if (clone.parentNode === this.banned[1].node) {
                heros.push(id);
            }
        }
        collection.setupHeros('禁将', heros, (id, node) => {
            if (this.mine) {
                this.ui.bind(node, () => {
                    this.yield(['banned', 'hero/' + id, node.classList.toggle('defer')]);
                });
            }
        });
        collection.open();
    }

    #showPicked() {
        for (const [id, collection] of this.collections) {
            if (!collection.hidden) {
                if (id.startsWith('pick:')) {
                    collection.close();
                    return;
                }
                break;
            }
        }
        const collection = this.#createCollection('pick');
        const heros = [];
        for (const [id, clone] of this.picked[2]) {
            if (clone.parentNode === this.picked[1].node) {
                heros.push(id);
            }
        }
        collection.setupHeros('点将', heros, (id, node) => {
            this.ui.bind(node, () => {
                this.#togglePick(id, !node.classList.toggle('defer'));
            });
        });
        collection.open();
    }

    #updatePicks() {
        // check if pick mode changed
        if (this.app.connected === this.#pickMode) {
            return;
        }
        this.#pickMode = this.app.connected;

        // get changed picks
        const newPicked = new Set<string>(this.db.get(this.#pick));
        const oldPicked = new Set();
        const tray = this.picked[1];

        for (const [id, clone] of this.picked[2]) {
            if (tray.items.has(clone)) {
                oldPicked.add(id);
                if (!newPicked.has(id)) {
                    this.#togglePick(id, false, false);
                }
            }
        }

        for (const id of newPicked) {
            if (!oldPicked.has(id)) {
                this.#togglePick(id, true, false);
            }
        }

        tray.align();
    }
}