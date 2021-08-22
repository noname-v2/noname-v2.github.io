import { hub } from '../../client/client';
import { Component, Toggle, Player } from '../../components';
import type { Config, Dict } from '../../types';

export class Lobby extends Component {
    /** Sidebar for configurations. */
    sidebar = this.ui.create('sidebar', this.node);

    /** Player seats. */
    seats = this.ui.createElement('seats', this.node);

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
    spectateDock = this.ui.createElement('dock');

    /** Button to choose hero. */
    heroButton = this.ui.createElement('widget.button');

    /** Container of chosen heros. */
    heroDock = this.ui.createElement('dock');

    init() {
        const arena = this.app.arena!;
        arena.appZoom.node.appendChild(this.node);
        this.listen('sync');
        this.sidebar.ready.then(() => {
            this.sidebar.setHeader('返回', () => arena.back());
            this.sidebar.setFooter('开始游戏', () => this.respond());
        });

        this.sidebar.pane.node.classList.add('fixed');
        this.ui.animate(this.sidebar.node, {x: [-220, 0]});
        this.ui.animate(this.seats, {scale: ['var(--app-splash-transform)', 1], opacity: [0, 1]});
    }

    /** Update connected players. */
    sync() {
        const peers = this.app.arena!.peers;
        
        // callback for online mode toggle
        if (this.mine) {
            this.yield(['sync', null, peers ? true : false]);
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
            this.#alignAvatars(this.spectateDock, spectators.map(peer => peer.data.avatar));
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

    /** Remove with fade and slide animation. */
    remove() {
        super.remove(new Promise<void>(resolve => {
            let done = 0;
            const onfinish = () => {
                if (++done === 2) {
                    resolve();
                }
            }
            this.ui.animate(this.sidebar.node, {x: [0, -220]}, {fill: 'forwards'}).onfinish = onfinish;
            this.ui.animate(this.seats, {opacity: [1, 0]}, {fill: 'forwards'}).onfinish = onfinish;
        }));
    }

    $pane(configs: {heropacks: Dict<string>, cardpacks: Dict<string>, configs: Dict<Config>}) {
        // mode options
        this.sidebar.pane.addSection('选项');
        for (const name in configs.configs) {
            const config = configs.configs[name];
            const toggle = this.sidebar.pane.addToggle(config.name!, result => {
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
        for (const name in configs.heropacks) {
            const toggle = this.sidebar.pane.addToggle(configs.heropacks[name], result => {
                this.freeze();
                this.yield(['banned', 'heropack/' + name, result]);
            });
            this.heroToggles.set(name, toggle);
        }
        
        // cardpacks
        this.sidebar.pane.addSection('卡牌');
        for (const name in configs.cardpacks) {
            const toggle = this.sidebar.pane.addToggle(configs.cardpacks[name], result => {
                this.freeze();
                this.yield(['banned', 'cardpack/' + name, result]);
            });
            this.cardToggles.set(name, toggle);
        }
    }

    $owner() {
        this.sidebar.pane.node.classList[this.mine ? 'remove' : 'add']('fixed');
        this.sidebar[this.mine ? 'showFooter' : 'hideFooter']();
    }

    $config(config: Dict) {
        this.unfreeze();

        // update toggles
        for (const key in config) {
            const toggle = this.configToggles.get(key);
            toggle?.assign(config[key]);
            const requires = this.configDynamicToggles.get(key);
            if (requires && toggle) {
                if (requires[0] === '!') {
                    toggle.node.style.display = !config[requires.slice(1)] ? '' : 'none';
                }
                else {
                    toggle.node.style.display = config[requires] ? '' : 'none';
                }
            }
        }

        // save configuration
        if (this.mine) {
            delete config.online;
            this.db.set(this.data.mode + ':config', config);
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
        const bar = this.ui.createElement('bar');
        this.seats.classList.add('offline');
        this.seats.appendChild(bar);
        bar.appendChild(this.spectateDock);
        bar.appendChild(this.spectateButton);
        bar.appendChild(this.heroButton);
        bar.appendChild(this.heroDock);
        this.spectateButton.innerHTML = '旁观';
        this.heroButton.innerHTML = '点将';
        
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
    #alignAvatars(dock: HTMLElement, names: string[]) {
        const frag = document.createDocumentFragment();
        const n = names.length;
        for (let i = 0; i < n; i++) {
            const img = this.ui.createElement('image.avatar');
            if (n < 4) {
                img.style.left = `${230 / (n + 1) * (i + 1) - 20}px`;
            }
            else if (n === 4) {
                const left = (230 - n * 40 - (n - 1) * 15) / 2;
                img.style.left = `${left + i * 55}px`;
            }
            else {
                img.style.left = `${190 / (n - 1) * i}px`;
            }
            this.ui.setImage(img, names[i]);
            frag.appendChild(img);
        }
        (dock as any).replaceChildren(frag);
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
}