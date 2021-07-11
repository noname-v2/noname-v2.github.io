import { Component, Toggle } from '../../components';

export class Lobby extends Component {
    sidebar = this.ui.create('sidebar', this.node);

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

    init() {
        this.app.arena!.node.appendChild(this.node);
        this.client.syncListeners.add(this);
        this.sidebar.ready.then(() => {
            this.sidebar.setHeader('返回', () => {
                const ws = this.client.connection;
                const peers = this.client.peers;
                if (peers || ws instanceof WebSocket) {
                    if (!peers || !Object.keys(peers).length || confirm('确定退出联机模式？')) {
                        if (ws instanceof WebSocket) {
                            this.client.clear();
                            ws.send('leave:init');
                        }
                        else {
                            this.freeze();
                            this.yield(['config', 'online', false], false);
                            this.exiting = true;
                        }
                    }
                }
                else {
                    this.close();
                }
            });
            this.sidebar.setFooter('开始游戏', () => {
                this.yield(null);
            });
        });
        this.sidebar.pane.node.classList.add('fixed');
        this.ui.animate(this.sidebar.node, {x: [-220, 0]});
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
            toggle.confirm = config.confirm;
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

    $np() {

    }

    sync() {
        const peers = this.client.peers;
        if (!peers && this.exiting) {
            this.close();
        }
        else if (this.owner === this.client.uid) {
            this.yield(['sync', null, peers ? true : false], false);
            if (this.connecting && !peers) {
                alert('连接失败');
            }
            this.connecting = false;
            const toggle = this.configToggles.get('online');
            if (toggle) {
                toggle.confirm = (peers && Object.keys(peers).length) ? [false] : null;
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
}