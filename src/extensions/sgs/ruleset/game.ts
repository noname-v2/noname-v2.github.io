import type { Collection } from '../sgs';

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

                // get names of hero packs and card packs
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

                // get configurations in sidebar
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

                // configuration for player number
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
                    if (!this.game.get('np')) {
                        this.game.set('np', npmax);
                    }
                }

                // create lobby
                lobby.update({npmax, pane: {heropacks, cardpacks, configs}});
                this.add('awaitStart');
                this.add('cleanUp');
            },
            awaitStart() {
                // monitor configuration change and await game start
                const lobby = this.game.links.get(this.parent!.lobbyID)!;
                lobby.owner = this.game.uid;
                lobby.set('mode', this.game.mode);
                lobby.set('config', this.game.config);
                lobby.set('disabledHeropacks', Array.from(this.game.disabledHeropacks));
                lobby.set('disabledCardpacks', Array.from(this.game.disabledCardpacks));
                lobby.monitor('updateLobby');
                lobby.await();
            },
            updateLobby(lobby, [type, key, val]: [string, string, any]) {
                if (type === 'sync') {
                    // game connected to or disconnected from hub
                    this.game.set('online', val);
                    lobby.set('config', this.game.config);

                    // add callback for client operations
                    if (this.game.peers) {
                        for (const peer of this.game.peers) {
                            peer.monitor('updatePeer');
                        }
                    }
                }
                else if (type === 'config') {
                    if (key === 'online') {
                        // enable or disable multiplayer mode
                        if (val) {
                            this.game.connect(val);
                        }
                        else {
                            this.game.disconnect();
                        }
                    }
                    else {
                        // game configuration change
                        this.game.set(key, val);
                        lobby.set('config', this.game.config);
                    }
                }
                else if (type === 'hero') {
                    // enable or disable a heropack
                    this.game.disabledHeropacks[val ? 'delete' : 'add'](key);
                    lobby.set('disabledHeropacks', Array.from(this.game.disabledHeropacks));
                }
                else if (type === 'card') {
                    // enable or disable a cardpack
                    this.game.disabledCardpacks[val ? 'delete' : 'add'](key);
                    lobby.set('disabledCardpacks', Array.from(this.game.disabledCardpacks));
                }
            },
            cleanUp() {
                // remove lobby and disable further configuration change
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