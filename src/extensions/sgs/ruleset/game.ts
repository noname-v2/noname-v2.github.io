import type { Collection } from '../sgs';

export const game = <Collection>{
    init: {
        content() {
            this.add('createLobby');
            this.add('createGame');
        },
        contents: {
            createLobby() {
                const lobby = this.game.create('lobby');
                this.data.lobby = lobby;

                // get names of hero packs and card packs
                const heropacks = {} as any;
                const cardpacks = {} as any;
                const configs = {} as any;
                for (const name of this.game.packs) {
                    const heropack = this.game.getRule(name + ':heropack');
                    const cardpack = this.game.getRule(name + ':cardpack');
                    if (heropack) {
                        heropacks[name] = heropack;
                    }
                    if (cardpack) {
                        cardpacks[name] = cardpack;
                    }
                }

                // get configurations in sidebar
                const fullConfigs = this.game.getRule('#config');
                for (const name in fullConfigs) {
                    configs[name] = {};
                    configs[name].name = fullConfigs[name].name;
                    configs[name].intro = fullConfigs[name].intro;
                    configs[name].options = fullConfigs[name].options;
                    configs[name].requires = fullConfigs[name].requires;
                    configs[name].confirm = fullConfigs[name].confirm;
                    this.game.config[name] ??= fullConfigs[name].init;
                }

                // configuration for player number
                const np = this.game.getRule(this.game.mode + ':mode').np;
                let npmax: number;
                if (typeof np === 'number') {
                    this.game.config.np = np;
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
                    this.game.config.np ??= npmax;
                }

                // create lobby
                lobby.update({npmax, pane: {heropacks, cardpacks, configs}});
                this.add('awaitStart');
                this.add('cleanUp');
            },
            awaitStart() {
                // monitor configuration change and await game start
                const lobby = this.parent.data.lobby;
                lobby.owner = this.game.uid;
                lobby.set('mode', this.game.mode);
                lobby.set('config', this.game.config);
                lobby.set('disabledHeropacks', Array.from(this.game.banned.heropacks));
                lobby.set('disabledCardpacks', Array.from(this.game.banned.cardpacks));
                lobby.monitor('updateLobby');
                lobby.await();
            },
            updateLobby(lobby, [type, key, val]: [string, string, any]) {
                if (type === 'sync') {
                    // game connected to or disconnected from hub
                    this.game.config.online = val;
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
                        // make sure np in range
                        if (key === 'np') {
                            const np = this.game.getRule(this.game.mode + ':mode').np;
                            if (!Array.isArray(np) || val < np[0] || val > np[np.length - 1]) {
                                return;
                            }
                        }

                        // game configuration change
                        this.game.config[key] = val;
                        lobby.set('config', this.game.config);

                        // update seats in the lobby
                        if (key === 'np' ) {
                            const players = this.game.peerPlayers;
                            if (players && players.length > val) {
                                for (let i = val; i < players.length; i++) {
                                    players[i].set('playing', false);
                                }
                            }
                            this.game.updateRoom();
                        }
                    }
                }
                else if (type === 'hero') {
                    // enable or disable a heropack
                    this.game.banned.heropacks[val ? 'delete' : 'add'](key);
                    lobby.set('disabledHeropacks', Array.from(this.game.banned.heropacks));
                }
                else if (type === 'card') {
                    // enable or disable a cardpack
                    this.game.banned.cardpacks[val ? 'delete' : 'add'](key);
                    lobby.set('disabledCardpacks', Array.from(this.game.banned.cardpacks));
                }
            },
            updatePeer(peer, val: string) {
                if (val === 'spectate' && peer.get('playing')) {
                    peer.set('playing', false);
                    this.game.updateRoom();
                }
                else if (val === 'play' && !peer.get('playing') && this.game.peerPlayers!.length < this.game.config.np) {
                    peer.set('playing', true);
                    this.game.updateRoom();
                }
            },
            cleanUp() {
                // remove lobby and disable further configuration change
                this.parent.data.lobby.unlink();
                this.game.start();
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