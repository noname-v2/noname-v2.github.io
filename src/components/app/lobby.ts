import { Component, Toggle, Player } from '../../components';

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

    /** Trying to exit. */
    exiting = false;

    /** Players in this seats. */
    players = <Player[]>[];

    /** Container of spectators. */
    spectateDock = this.ui.createElement('dock');

    /** Container of chosen heros. */
    heroDock = this.ui.createElement('dock');

    init() {
        this.app.arena!.node.appendChild(this.node);
        this.client.listeners.sync.add(this);
        this.client.listeners.history.add(this);

        // make android back button function as returning to previous page
        if (this.client.platform === 'Android') {
            history.pushState('lobby', '');
        }
        this.sidebar.ready.then(() => {
            this.sidebar.setHeader('返回', () => {
                if (history.state === 'lobby') {
                    history.back();
                }
                else {
                    this.back();
                }
            });
            this.sidebar.setFooter('开始游戏', () => this.yield(null));
        });

        this.sidebar.pane.node.classList.add('fixed');
        this.ui.animate(this.sidebar.node, {x: [-220, 0]});
        this.ui.animate(this.seats, {scale: ['var(--app-splash-transform)', 1], opacity: [0, 1]});
    }

    async back() {
        const ws = this.client.connection;
        const peers = this.client.peers;
        if (peers || ws instanceof WebSocket) {
            // history back posponded
            if (this.client.platform === 'Android') {
                history.forward();
            }

            const content = ws instanceof WebSocket ? '确定退出当前房间？': '当前房间有其他玩家，退出后将断开连接并请出所有其他玩家，确定退出当前模式？';
            if (!peers || Object.keys(peers).length <= 1 || await this.app.confirm('联机模式', {content, id: 'exitLobby'})) {
                if (ws instanceof WebSocket) {
                    this.client.clear();
                    ws.send('leave:init');
                }
                else {
                    this.freeze();
                    this.yield(['config', 'online', false], false);
                    this.exiting = true;
                }

                if (history.state === 'lobby') {
                    this.client.listeners.history.delete(this);
                    history.back();
                }
            }
        }
        else {
            this.close();
        }
    }

    $pane(configs: any) {
        this.sidebar.pane.addSection('选项');
        for (const name in configs.configs) {
            const config = configs.configs[name];
            const toggle = this.sidebar.pane.addToggle(config.name, result => {
                this.freeze();
                if (name === 'online' && result) {
                    this.connecting = true;
                    this.yield(['config', name, this.client.url], false);
                }
                else {
                    this.yield(['config', name, result], false);
                }
            }, config.options);
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
        this.sidebar.pane.addSection('武将');
        for (const name in configs.heropacks) {
            const toggle = this.sidebar.pane.addToggle(configs.heropacks[name], result => {
                this.freeze();
                this.yield(['hero', name, result], false);
            });
            this.heroToggles.set(name, toggle);
        }
        this.sidebar.pane.addSection('卡牌');
        for (const name in configs.cardpacks) {
            const toggle = this.sidebar.pane.addToggle(configs.cardpacks[name], result => {
                this.freeze();
                this.yield(['card', name, result], false);
            });
            this.cardToggles.set(name, toggle);
        }
    }

    $owner(uid: string) {
        this.sidebar.pane.node.classList[uid === this.client.uid ? 'remove' : 'add']('fixed');
        this.sidebar[uid === this.client.uid ? 'showFooter' : 'hideFooter']();
    }

    $config(config: {[key: string]: any}) {
        this.unfreeze();
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
        if (this.owner === this.client.uid) {
            delete config.online;
            this.db.set(this.get('mode') + ':config', config);
        }
    }

    $disabledHeropacks(packs: string[]) {
        this.unfreeze();
        for (const [name, toggle] of this.heroToggles.entries()) {
            toggle.assign(!packs.includes(name));
        }
        if (this.owner === this.client.uid) {
            this.db.set(this.get('mode') + ':disabledHeropacks', packs.length > 0 ? packs : null);
        }
    }
    
    $disabledCardpacks(packs: string[]) {
        this.unfreeze();
        for (const [name, toggle] of this.cardToggles.entries()) {
            toggle.assign(!packs.includes(name));
        }
        if (this.owner === this.client.uid) {
            this.db.set(this.get('mode') + ':disabledCardpacks', packs.length > 0 ? packs : null);
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
        }
        if (npmax > 4) {
            this.seats.classList.add('two-rows');
        }
        else {
            this.seats.classList.remove('two-rows');
        }

        // buttons below the seats
        this.seats.appendChild(document.createElement('div'));
        const bar = this.ui.createElement('bar');
        this.seats.appendChild(bar);
        bar.appendChild(this.spectateDock);
        const spectate = this.ui.createElement('widget.button', bar);
        const hero = this.ui.createElement('widget.button', bar);
        bar.appendChild(this.heroDock);
        spectate.innerHTML = '旁观';
        hero.innerHTML = '点将';
    }

    sync() {
        const peers = this.client.peers;
        if (!peers && this.exiting) {
            // room closed successfully
            this.close();
        }
        else if (this.owner === this.client.uid) {
            // callback for online mode toggle
            this.yield(['sync', null, peers ? true : false], false);
            if (this.connecting && !peers) {
                this.app.alert('连接失败');
            }
            this.connecting = false;
            const toggle = this.configToggles.get('online');
            if (toggle) {
                if (peers && Object.keys(peers).length > 1) {
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
        for (const id of peers || []) {
            const peer = this.client.components.get(id)!;
            if (peer.get('playing')) {
                players.push(peer);
            }
            else {
                spectators.push(peer);
            }
        }
        for (let i = 0; i < this.players.length; i++) {
            if (i < players.length) {
                const peer = players[i]!;
                this.players[i].set('heroImage', peer.get('avatar'));
                this.players[i].set('heroName', peer.get('nickname'));
            }
            else {
                this.players[i].set('heroImage', null);
                this.players[i].set('heroName', null);
            }
        }
    }

    freeze() {
        this.sidebar.pane.node.classList.add('pending');
    }

    unfreeze() {
        this.sidebar.pane.node.classList.remove('pending');
    }

    close() {
        this.client.disconnect();
        this.ui.animate(this.sidebar.node, {x: [0, -220]}, {fill: 'forwards'});
    }

    async history(state: string) {
        if (this.client.platform === 'Android' && state !== 'lobby') {
            if (this.app.popups.has('exitLobby')) {
                this.app.removePopup('exitLobby');
                history.forward();
            }
            else {
                this.back();
            }
        }
    }
}