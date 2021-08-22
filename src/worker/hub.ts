import { hub2owner } from '../hub/types';
import { split } from '../utils';
import { dispatch, send, globals } from './worker';
import type { Dict } from '../types';

/** Hub related operations. */
export class Hub {
    get peers() {
        return this.#getPeers();
    }

    get players() {
        return this.#getPeers({playing: true});
    }

    get spectators() {
        return this.#getPeers({playing: false});
    }

    /** Connect to remote hub. */
    connect(url: string) {
        if (globals.connection) {
            return;
        }
        const ws = globals.connection = new WebSocket('wss://' + url);
        ws.onerror = ws.onclose = () => {
            if (globals.connection === ws) {
                delete globals.connection;
                if (globals.peers) {
                    for (const peer of globals.peers.values()) {
                        peer.unlink();
                    }
                }
                delete globals.peers;
                this.#sync();
            }
        };
        ws.onopen = () => {
            ws.send('init:' + JSON.stringify([
                globals.room.uid, globals.room.info, this.update(false)
            ]));
        };
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
        const ws = globals.connection;
        if (ws) {
            ws.send('edit:close');
            setTimeout(() => {
                if (ws === globals.connection) {
                    ws.close();
                }
            }, 1000);
        }
    }

    /** Update room info for idle clients. */
    update(push=true) {
        const state = JSON.stringify([
            // mode name
            globals.room.mode.name,
            // joined players
            this.players?.length ?? 1,
            // number of players in a game
            globals.room.config.np,
            // nickname and avatar of owner
            globals.room.info,
            // game state
            globals.room.progress
        ]);
        if (push) {
            globals.connection?.send('edit:' + state);
        }
        return state;
    }

    /** The room is ready for clients to join. */
    #ready() {
        globals.peers = new Map();
        this.#createPeer(globals.room.uid, globals.room.info);
    }

    /** A remote client joins the room. */
    #join(msg: string) {
        // join as player or spectator
        const [uid, info]: [string, [string, string]] = JSON.parse(msg);
        this.#createPeer(uid, info);
        this.update();
        send(uid, globals.room.pack());
    }

    /** A remote client leaves the room. */
    #leave(uid: string) {
        if (globals.peers?.has(uid)) {
            globals.peers.get(uid)!.unlink();
            globals.peers.delete(uid);
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
        let links = null;
        if (globals.peers) {
            links = [];
            for (const peer of globals.peers.values()) {
                links.push(peer.id);
            }
        }
        globals.room.arena.peers = links;
    }

    /** Get peers that match certain condition. */
    #getPeers(filter?: Dict) {
        if (!globals.peers) {
            return null;
        }
        const links = [];
        for (const peer of globals.peers.values()) {
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
        const peer = globals.room.create('peer');
        peer.update({
            owner: uid,
            nickname: info[0],
            avatar: info[1],
            playing: this.players!.length < globals.room.config.np
        });
        globals.peers!.set(uid, peer);
        this.#sync();
    }
}
