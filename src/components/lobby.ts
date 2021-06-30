import { Component, Sidebar, Toggle } from '../components';

export class Lobby extends Component {
    sidebar = <Sidebar>this.ui.create('sidebar', this.node);

    /** Toggles for mode configuration. */
    configToggles = new Map<string, Toggle>();

    /** Toggles for hero packs. */
    heroToggles = new Map<string, Toggle>();

    /** Toggles for card packs. */
    cardToggles = new Map<string, Toggle>();

    init() {
        this.app.arena!.node.appendChild(this.node);
        this.sidebar.ready.then(() => {
            this.sidebar.setHeader('返回', () => {
                this.client.disconnect();
                this.ui.animate(this.sidebar.node, {x: [0, -220]}, {fill: 'forwards'});
            });
            this.sidebar.setFooter('开始游戏', () => {
                console.log('start');
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
                this.yield(['config', name, result], false);
            }, config.options);
            this.configToggles.set(name, toggle);
        }
        this.sidebar.pane.addSection('武将');
        for (const name in configs.heropacks) {
            const toggle = this.sidebar.pane.addToggle(configs.heropacks[name], result => {
                this.yield(['hero', name, result], false);
            });
            this.heroToggles.set(name, toggle);
        }
        this.sidebar.pane.addSection('卡牌');
        for (const name in configs.cardpacks) {
            const toggle = this.sidebar.pane.addToggle(configs.cardpacks[name], result => {
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
        for (const key in config) {
            this.configToggles.get(key)?.assign(config[key]);
        }
        if (this.owner === this.client.uid) {
            this.db.set(this.get('mode') + ':config', config);
        }
    }
    $disabledHeropacks(packs: string[]) {
        for (const [name, toggle] of this.heroToggles.entries()) {
            toggle.assign(!packs.includes(name));
        }
        if (this.owner === this.client.uid) {
            this.db.set(this.get('mode') + ':disabledHeropacks', packs.length > 0 ? packs : null);
        }
    }
    $disabledCardpacks(packs: string[]) {
        for (const [name, toggle] of this.cardToggles.entries()) {
            toggle.assign(!packs.includes(name));
        }
        if (this.owner === this.client.uid) {
            this.db.set(this.get('mode') + ':disabledCardpacks', packs.length > 0 ? packs : null);
        }
    }
}