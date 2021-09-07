import { hub } from '../../client/client';
import { Component, Toggle, Player, Tray, Collection } from '../../components';
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

    /** Cache of collections. */
    collections = new Map<string, Collection>();

    get #config() {
        const arena = this.app.arena!;
        return arena.data.mode + ':' + (arena.data.peers ? 'online_' : '') + 'config';
    }

    init() {
        const arena = this.app.arena!;
        arena.appZoom.node.appendChild(this.node);
        this.listen('sync');
        this.sidebar.ready.then(() => {
            this.sidebar.setHeader('返回', () => arena.back());
            this.sidebar.setFooter('开始游戏', () => this.yield(['start']));
            // this.sidebar.setFooter('开始游戏', () => this.respond());
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
            }
            else {
                this.players[i].data.heroImage = null;
                this.players[i].data.heroName = null;
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
            else {
                this.respond();
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
        this.sidebar.pane.addSection('选项');
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
        this.sidebar.pane.addSection('武将');
        for (const pack of configs.heropacks) {
            const name = this.app.accessExtension(pack, 'heropack');
            const toggle = this.sidebar.pane.addToggle([
                name, () => this.#openCollection(pack, 'hero')
            ], result => {
                this.freeze();
                this.yield(['banned', 'heropack/' + pack, result]);
            });
            this.heroToggles.set(pack, toggle);
        }
        
        // cardpacks
        this.sidebar.pane.addSection('卡牌');
        for (const pack of configs.cardpacks) {
            const name = this.app.accessExtension(pack, 'cardpack');
            const toggle = this.sidebar.pane.addToggle([
                name, () => this.#openCollection(pack, 'card+pile')
            ], result => {
                this.freeze();
                this.yield(['banned', 'cardpack/' + pack, result]);
            });
            this.cardToggles.set(pack, toggle);
        }

        // banned heros
        this.banned = [
            this.sidebar.pane.addSection('禁将'),
            this.sidebar.pane.addTray('round'),
            new Map()
        ];
        this.banned[0].style.display = 'none';
        this.banned[1].node.style.display = 'none';
    }

    $owner() {
        this.sidebar.pane.node.classList[this.mine ? 'remove' : 'add']('fixed');
        this.sidebar[this.mine ? 'showFooter' : 'hideFooter']();
        if (this.mine) {
            this.yield(['sync', null, [false, this.db.get(this.#config) || {}]]);
        }
    }

    $config(config: Dict, oldConfig: Dict) {
        this.unfreeze();

        // update toggles
        for (const [key, toggle] of this.configToggles) {
            if (key in config) {
                toggle.assign(config[key]);
                const requires = this.configDynamicToggles.get(key);
                if (requires) {
                    if (requires[0] === '!') {
                        toggle.node.style.display = !config[requires.slice(1)] ? '' : 'none';
                    }
                    else {
                        toggle.node.style.display = config[requires] ? '' : 'none';
                    }
                }
            }
            else {
                toggle.node.style.display = 'none';
            }
        }

        // save configuration
        if (this.mine) {
            delete config.online;
            this.db.set(this.#config, config);
        }

        // update spectators
        if (config.np) {
            // make sure npmax is set
            setTimeout(() => {
                for (let i = 0; i < this.data.npmax; i++) {
                    this.players[i].node.classList[i < config.np ? 'remove' : 'add']('blurred');
                }
                this.#checkSpectate();
            });
        }

        // update banned packs
        for (const [name, toggle] of this.heroToggles) {
            toggle.assign(config.banned?.heropack?.includes(name) ? false : true);
        }
        for (const [name, toggle] of this.cardToggles) {
            toggle.assign(config.banned?.cardpack?.includes(name) ? false : true);
        }

        // update banned hero
        const old = oldConfig?.banned?.hero;
        if (old) {
            for (const id of old) {
                this.banned[2].get(id)?.classList.remove('defer');
            }
        }

        if (config.banned?.hero?.length) {
            const tray = this.banned[1];
            this.banned[0].style.display = '';
            tray.node.innerHTML = '';
            tray.node.style.display = '';
            tray.items.clear();
            for (const id of config.banned.hero) {
                const clone = this.ui.createElement('widget.avatar');
                this.ui.setImage(clone, id);
                this.ui.bind(clone, () => {
                    if (this.mine) {
                        this.yield(['banned', 'hero/' + id, true]);
                    }
                });
                tray.items.set(clone, tray.items.size);
                this.banned[2].get(id)?.classList.add('defer');
            }
            tray.align();
            for (const clone of tray.items.keys()) {
                tray.node.appendChild(clone);
            }
        }
        else {
            this.banned[0].style.display = 'none';
            this.banned[1].node.style.display = 'none';
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

    #openCollection(pack: string, type: 'hero' | 'card+pile') {
        const id = type + '|' + pack;
        let collection: Collection;
        if (!this.collections.has(id)) {
            collection = this.ui.create('collection');
            collection.arena = true;
            collection.flex = true;
            collection.ready.then(() => {
                this.ui.bind(collection.pane.node, () => collection.close());
            });
            collection.setup(pack, type, (id, node) => {
                if (type === 'hero') {
                    this.ui.bind(node, () => {
                        if (this.mine) {
                            this.yield(['banned', 'hero/' + id, node.classList.contains('defer')]);
                        }
                    });
                    this.banned[2].set(id, node);
                    if (this.data.config?.banned?.hero?.includes(id)) {
                        node.classList.add('defer');
                    }
                }
            });
            this.collections.set(id, collection);

            // open and close animations
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
                    node = collection.pileGallery?.node!;
                }
                else {
                    collection.gallery.checkPage();
                    node = collection.gallery.node;
                }
                if (node) {
                    this.ui.animate(node, {scale: ['var(--pop-transform)', 1]});
                }
            };
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
                    node = collection.pileGallery?.node!;
                }
                else {
                    node = collection.gallery.node;
                }
                if (node) {
                    this.ui.animate(node, {scale: [1, 'var(--pop-transform)']});
                }
            };
        }
        this.collections.get(id)!.open();
    }
}