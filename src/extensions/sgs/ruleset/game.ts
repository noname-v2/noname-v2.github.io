import type { Collection } from '../../extension';

export const game = <Collection>{
    init: {
        content() {
            this.add('createLobby');
            this.add('createGame');
        },
        contents: {
            createLobby() {
                const lobby = this.create('lobby');
                this.lobbyID = lobby.id;
                const heropacks = {} as any;
                const cardpacks = {} as any;
                const configs = {} as any;
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
                    configs[name].options = fullConfigs[name].options;
                    configs[name].requires = fullConfigs[name].requires;
                    configs[name].confirm = fullConfigs[name].confirm;

                    if (this.game.get(name) === null) {
                        this.game.set(name, fullConfigs[name].init);
                    }
                }
                const np = this.getRule(this.game.mode + ':mode').np;
                let npmax: number;
                if (typeof np === 'number') {
                    this.game.set('np', np);
                    npmax = np;
                }
                else {
                    npmax = np[np.length - 1];
                    const nps = [];
                    for (const n of np) {
                        nps.push([n, `<span class="mono">${n}</span>人`]);
                    }
                    configs.np = {
                        name: '游戏人数',
                        options: nps,
                        init: npmax
                    };
                    if (this.game.get('np') === null) {
                        this.game.set('np', npmax);
                    }
                }
                lobby.set('pane', {heropacks, cardpacks, configs});
                lobby.set('npmax', npmax);
                this.add('awaitStart');
                this.add('cleanUp');
            },
            awaitStart() {
                const lobby = this.game.links.get(this.parent!.lobbyID)!;
                lobby.owner = this.game.uid;
                lobby.syncing = true;
                lobby.set('mode', this.game.mode);
                lobby.set('config', this.game.config);
                lobby.set('disabledHeropacks', Array.from(this.game.disabledHeropacks));
                lobby.set('disabledCardpacks', Array.from(this.game.disabledCardpacks));
                lobby.monitor('updateLobby');
            },
            updateLobby(lobby, [type, key, val]: [string, string, any]) {
                if (type === 'sync') {
                    this.game.set('online', val);
                    lobby.set('config', this.game.config);
                }
                else if (type === 'config') {
                    if (key === 'online') {
                        if (val) {
                            this.game.connect(val);
                        }
                        else {
                            this.game.disconnect();
                        }
                    }
                    else {
                        this.game.set(key, val);
                        lobby.set('config', this.game.config);
                    }
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
            cleanUp() {
                const lobby = this.game.links.get(this.parent!.lobbyID)!;
                lobby.unlink();
                this.game.freeze();
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
}