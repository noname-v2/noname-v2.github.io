import { hub2owner } from '../hub/types';
import { split } from '../utils';
import { dispatch, send } from './worker';
import { connection, room, set } from './globals';
import type { Link } from './link';
import type { Dict } from '../types';

/** Hub related operations. */
export class Hub {
    /** IDs and links of connected clients. */
    #peers: Map<string, Link> | null = null;

    get peers() {
        return this.#getPeers();
    }

    get players() {
        return this.#getPeers({playing: true});
    }

    get spectators() {
        return this.#getPeers({playing: false});
    }

    get connected() {
        return this.#peers ? true : false;
    }

    /** Connect to remote hub. */
    connect(url: string) {
        if (connection) {
            return;
        }
        const ws = new WebSocket('wss://' + url);
        set('connection', ws);

        // connection closed
        ws.onerror = ws.onclose = () => {
            if (connection === ws) {
                set('connection', null);
                if (this.#peers) {
                    for (const peer of this.#peers.values()) {
                        peer.unlink();
                    }
                }
                this.#peers = null;
                this.#sync();
            }
        };

        // send room info to hub
        ws.onopen = () => {
            ws.send('init:' + JSON.stringify([
                room.uid, room.info, this.update(false)
            ]));
        };

        // handle messages
        ws.onmessage = ({data}) => {
            try {
                const [method, arg] = split<typeof hub2owner[number]>(data);
                switch (method) {
                    case 'ready': this.#ready(); break;
                    case 'join': this.#join(arg); break;
                    case 'leave': this.#leave(arg); break;
                    case 'resp' : this.#resp(arg); break;
                }
            }
            catch (e) {
                console.log(e, data);
            }
        };
    }

    /** Disconnect from remote hub. */
    disconnect() {
        const ws = connection;
        if (ws) {
            ws.send('edit:close');
            setTimeout(() => {
                if (ws === connection) {
                    ws.close();
                }
            }, 1000);
        }
    }

    /** Update room info for idle clients. */
    update(push=true) {
        const state = JSON.stringify([
            // mode name
            room.game.mode.name,
            // joined players
            this.players?.length ?? 1,
            // number of players in a game
            room.game.config.np,
            // nickname and avatar of owner
            room.info,
            // game state
            room.progress
        ]);
        if (push) {
            connection?.send('edit:' + state);
        }
        return state;
    }

    /** The room is ready for clients to join. */
    #ready() {
        this.#peers = new Map();
        this.#createPeer(room.uid, room.info);
    }

    /** A remote client joins the room. */
    #join(msg: string) {
        // join as player or spectator
        const [uid, info]: [string, [string, string]] = JSON.parse(msg);
        this.#createPeer(uid, info);
        this.update();
        send(uid, room.pack());
    }

    /** A remote client leaves the room. */
    #leave(uid: string) {
        if (this.#peers?.has(uid)) {
            this.#peers.get(uid)!.unlink();
            this.#peers.delete(uid);
            this.#sync();
            this.update();
        }
    }

    /** A remote client sends a response message. */
    #resp(msg: string) {
        dispatch(JSON.parse(msg));
    }

    /** Tell registered components about client update. */
    #sync() {
        let ids = null;
        if (this.#peers) {
            ids = [];
            for (const peer of this.#peers.values()) {
                ids.push(peer.id);
            }
        }
        room.arena.peers = ids;
    }

    /** Get peers that match certain condition. */
    #getPeers(filter?: Dict) {
        if (!this.#peers) {
            return null;
        }
        const links = [];
        for (const peer of this.#peers.values()) {
            let skip = false;
            for (const key in filter) {
                if (peer[key] !== filter[key]) {
                    skip = true;
                    continue;
                }
            }
            if (!skip) {
                links.push(peer);
            }
        }
        return links;
    }

    /** Create a peer component. */
    #createPeer(uid: string, info: [string, string]) {
        const peer = room.create('peer');
        peer.update({
            owner: uid,
            nickname: info[0],
            avatar: info[1],
            playing: this.players!.length < room.game.config.np
        });
        this.#peers!.set(uid, peer);
        this.#sync();
    }
}
