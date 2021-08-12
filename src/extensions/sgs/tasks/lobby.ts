import type { TaskClass, Link, Config, Dict } from '../types';

export function lobby(T: TaskClass) {
    return class Lobby extends T {
        lobby!: Link;

        main() {
            const lobby = this.lobby = this.game.create('lobby');

            // get names of hero packs and card packs
            const heropacks: Dict<string> = {};
            const cardpacks: Dict<string> = {};
            const configs: Dict<Config> = {};
            Object.assign(configs, this.game.mode.config);

            for (const name of this.game.packs) {
                const heropack = this.game.getExtension(name + ':heropack');
                const cardpack = this.game.getExtension(name + ':cardpack');
                if (heropack) {
                    heropacks[name] = heropack;
                }
                if (cardpack) {
                    cardpacks[name] = cardpack;
                }
            }

            // set default configurations
            for (const name in configs) {
                this.game.config[name] ??= configs[name].init;
            }

            // configuration for player number
            const np = this.game.mode.np!;
            let npmax: number;
            if (typeof np === 'number') {
                this.game.config.np = np;
                npmax = np;
            }
            else {
                npmax = np[np.length - 1];
                configs.np = {
                    name: '游戏人数',
                    options: [],
                    init: npmax
                };
                for (const n of np) {
                    configs.np.options!.push([n, `<span class="mono">${n}</span>人`]);
                }
                this.game.config.np ??= npmax;
            }

            // create lobby
            lobby.npmax = npmax;
            lobby.pane = {heropacks, cardpacks, configs};
            this.add('awaitStart');
            this.add('cleanUp');
        }

        /** Listen to configuration changes while awaiting game start. */
        awaitStart() {
            // monitor configuration change and await game start
            const lobby = this.lobby;
            lobby.owner = this.game.owner;
            lobby.mode = this.game.mode.extension;
            lobby.config = this.game.config;
            lobby.config.banned ??= {};
            this.monitor(lobby, 'updateLobby');
            this.await(lobby);
        }

        /** Update game configuration. */
        updateLobby([type, key, val]: [string, string, any]) {
            if (type === 'sync') {
                // game connected to or disconnected from hub
                this.game.config.online = val;
                this.lobby.config = this.game.config;

                // add callback for client operations
                const peers = this.game.hub.peers;
                if (peers) {
                    for (const peer of peers) {
                        this.monitor(peer, 'updatePeer');
                    }
                }
            }
            else if (type === 'config') {
                if (key === 'online') {
                    // enable or disable multiplayer mode
                    if (val) {
                        this.game.hub.connect(val);
                    }
                    else {
                        this.game.hub.disconnect();
                    }
                }
                else {
                    // make sure np in range
                    if (key === 'np') {
                        const np = this.game.mode.np;
                        if (!Array.isArray(np) || val < np[0] || val > np[np.length - 1]) {
                            return;
                        }
                    }

                    // game configuration change
                    this.game.config[key] = val;
                    this.lobby.config = this.game.config;

                    // update seats in the lobby
                    if (key === 'np' ) {
                        const players = this.game.hub.players;
                        if (players && players.length > val) {
                            for (let i = val; i < players.length; i++) {
                                players[i].playing = false;
                            }
                        }
                        this.game.hub.update();
                    }
                }
            }
            else if (type === 'banned') {
                const [section, name] = this.game.utils.split(key, '/');
                const set = new Set(this.game.config.banned[section]);
                set[val ? 'delete' : 'add'](name);
                if (set.size) {
                    this.game.config.banned[section] = Array.from(set);
                }
                else {
                    delete this.game.config.banned[section];
                }
                this.lobby.config = this.game.config;
            }
        }

        /** Update info about joined players. */
        updatePeer(val: string, peer: Link) {
            if (val === 'spectate' && peer.playing) {
                peer.playing = false;
                this.game.hub.update();
            }
            else if (val === 'play' && !peer.playing && this.game.hub.players!.length < this.game.config.np) {
                peer.playing = true;
                this.game.hub.update();
            }
        }

        /** Remove lobby and start game. */
        cleanUp() {
            // remove lobby and disable further configuration change
            this.lobby.unlink();
            this.game.start();
        }
    }
}