import { Task } from './task';
import * as hub from '../worker/hub';
import type { Peer, Lobby, Config, Dict } from '../types-worker';
import type { ArenaBanned, ArenaConfig } from '../links/arena';

export class LobbyWait extends Task {
    lobby!: Lobby;

    main() {
        const lobby = this.lobby = this.arena.create('lobby');

        // get names of hero packs and card packs
        const heropacks: string[] = [];
        const cardpacks: string[] = [];
        const configs: Dict<Config> = {};
        Object.assign(configs, this.arena.mode.config);

        for (const name of this.arena.packs) {
            const heropack = this.arena.accessExtension(name, 'heropack');
            const cardpack = this.arena.accessExtension(name, 'cardpack');
            if (heropack) {
                heropacks.push(name);
            }
            if (cardpack) {
                cardpacks.push(name);
            }
        }

        // configuration for player number
        const np = this.arena.mode.np!;
        let npmax: number;
        if (typeof np === 'number') {
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
        }

        // create lobby
        lobby.data.npmax = npmax;
        lobby.data.pane = {heropacks, cardpacks, configs};
        this.add('awaitStart');
        this.add('cleanUp');
    }

    /** Await initial configuration. */
    awaitStart() {
        const lobby = this.lobby;
        lobby.data.owner = this.arena.owner;
        lobby.monitor('updateLobby');
        lobby.await();
    }

    /** Update game configuration. */
    updateLobby([type, key, val]: [string, string, any]) {
        if (type === 'sync') {
            // game connected to or disconnected from hub
            if (val[1]) {
                const config = this.arena.config = { online: val[0], banned: {} } as ArenaConfig;
                this.arena.utils.apply(config, val[1]);

                // fill default entries
                for (const key in this.arena.mode.config) {
                    const entry = this.arena.mode.config[key];
                    const requires = entry.requires;
                    if ((val[0] && requires === '!online') || (!val[0] && requires === 'online')) {
                        delete this.arena.config[key];
                    }
                    else {
                        this.arena.config[key] ??= entry.init;
                    }
                }

                // fill player number
                const np = this.arena.mode.np;
                if (Array.isArray(np)) {
                    if (!('np' in config)) {
                        (config as ArenaConfig).np = np[np.length - 1];
                    }
                }
                else if (typeof np === 'number') {
                    config.np = np;
                }

                this.lobby.data.config = config;
            }

            // add callback for client operations
            const peers = this.arena.hub.peers;
            if (peers) {
                for (const peer of peers) {
                    peer.monitor('updatePeer');
                }
            }
        }
        else if (type === 'config') {
            if (key === 'online') {
                // enable or disable multiplayer mode
                if (val) {
                    hub.connect(val);
                }
                else {
                    hub.disconnect();
                }
            }
            else {
                // make sure np in range
                if (key === 'np') {
                    const np = this.arena.mode.np;
                    if (!Array.isArray(np) || val < np[0] || val > np[np.length - 1]) {
                        return;
                    }
                }

                // game configuration change
                this.arena.config[key] = val;
                this.lobby.patch('config', { [key]: val });

                // update seats in the lobby
                if (key === 'np' ) {
                    const players = this.arena.hub.players;
                    if (players && players.length > val) {
                        for (let i = val; i < players.length; i++) {
                            players[i].data.playing = false;
                        }
                    }
                    hub.update();
                }
            }
        }
        else if (type === 'banned') {
            const [section, name] = this.arena.utils.split(key, '/') as [keyof ArenaBanned, string];
            const set = new Set(this.arena.config.banned[section]);
            set[val ? 'delete' : 'add'](name);
            const banned = Array.from(set);
            this.lobby.patch('config', { banned: { [section]: banned } })
            this.arena.config.banned[section] = banned;
        }
        else if (type === 'start') {
            this.lobby.call('checkStart', [
                this.arena.mode.minHeroCount,
                this.arena.heros.size,
                this.arena.mode.minPileCount,
                this.arena.pile.length
            ])
        }
    }

    /** Update info about joined players. */
    updatePeer(val: string, peer: Peer) {
        if (val === 'spectate' && peer.data.playing) {
            peer.data.playing = false;
            hub.update();
        }
        else if (val === 'play' && !peer.data.playing && this.arena.hub.players!.length < this.arena.config.np) {
            peer.data.playing = true;
            hub.update();
        }
        else if (val === 'prepare') {
            if (peer.owner === this.arena.owner) {
                peer.data.ready = [14, Date.now()];
            }
            else {
                peer.data.ready = true;
            }
        }
        else if (val === 'unprepare') {
            peer.data.ready = false;
        }
    }

    /** Remove lobby and start game. */
    cleanUp() {
        this.lobby.unlink();
        this.arena.start();
    }
}