import { version } from '../version';
import { Game } from './game';
import { hub2owner } from '../hub/types';
import { split } from '../utils';
import type { Link } from './link';

/** An update to client side. */
export type UITick = [
    // stage ID
    number | null,
    // add or delete components
    {[key: string]: string | null},
    // component property updates
    {[key: string]: {[key: string]: any}},
    // component function calls
    {[key: string]: [string, any][]}
];

/** Client-side message */
export type ClientMessage = [string, number, number, any, boolean];


/**
 * Manager of component syncing between client and server.
 */
export class Worker {
    /** Worker version. */
    version = version;

    /** User identifier. */
    uid!: string;

    /** User nickname and avatar. */
    info!: [string, string];

    /** Connected hub. */
    connection: WebSocket | null = null;

    /** Links of connected clients. */
    peers: Map<string, Link> | null = null;

    /** Game object. */
    #game!: Game;

    /**
     * Setup communication.
     */
    constructor() {
        self.onmessage = ({data}: {data: ClientMessage}) => {
            this.uid = data[0];
            this.#game = new Game(data[3], this);
        }
        (self as any).postMessage('ready');
    }

    /** Send a message to all clients. */
    broadcast(tick: UITick) {
        if (this.connection) {
            // broadcast tick
            this.connection.send('bcast:' + JSON.stringify(tick));
        }
        this.tick(tick);
    }

    /** Send a message to a client. */
    send(uid: string, tick: UITick) {
        if (uid === this.uid) {
            this.tick(tick);
        }
        else if (this.#game && this.peers) {
            // send tick to a remote client
            this.connection!.send('to:' + JSON.stringify([
                uid, JSON.stringify(tick)
            ]))
        }
    }

    /** Send a message to local client. */
    tick(tick: UITick) {
        (self as any).postMessage(tick);
    }

    /** Connect to remote hub. */
    connect(url: string) {
        if (this.connection) {
            return;
        }
        const ws = this.connection = new WebSocket('wss://' + url);
        ws.onerror = ws.onclose = () => {
            if (this.connection === ws) {
                this.connection = null;
            }
            if (this.peers) {
                for (const peer of this.peers.values()) {
                    peer.unlink();
                }
            }
            this.peers = null;
            this.sync();
        };
        ws.onopen = () => {
            ws.send('init:' + JSON.stringify([this.uid, this.info, this.#game.updateRoom(false)]));
        };
        ws.onmessage = ({data}) => {
            try {
                const [method, arg] = split<typeof hub2owner[number]>(data);
                this[method](arg);
            }
            catch (e) {
                console.log(e, data);
            }
        };
    }

    /** Disconnect from remote hub. */
    disconnect() {
        const ws = this.connection;
        if (ws) {
            ws.send('edit:close');
            setTimeout(() => {
                if (ws === this.connection) {
                    ws.close();
                }
            }, 1000);
        }
    }

    /** Tell registered components about client update. */
    sync() {
        let peers = null;
        if (this.peers) {
            peers = [];
            for (const peer of this.peers.values()) {
                peers.push(peer.id);
            }
        }
        this.#game.arena.update({peers});
    }

    /** The room is ready for clients to join. */
    ready() {
        this.peers = new Map();
        this.createPeer(this.uid, this.info);
    }

    /** A remote client joins the room. */
    join(msg: string) {
        // join as player or spectator
        const [uid, info] = <[string, [string, string]]>JSON.parse(msg);
        this.createPeer(uid, info);
        this.#game.updateRoom();
        this.send(uid, this.#game.pack());
    }

    /** A remote client leaves the room. */
    leave(uid: string) {
        if (this.peers?.has(uid)) {
            this.peers.get(uid)!.unlink();
            this.peers.delete(uid);
            this.sync();
            this.#game.updateRoom();
        }
    }

    /** A remote client sends a response message. */
    resp(msg: string) {
        (self as any).onmessage({data: JSON.parse(msg)});
    }

    /** Create a peer component. */
    createPeer(uid: string, info: [string, string]) {
        const peer = this.#game.create('peer');
        peer.update({
            owner: uid,
            nickname: info[0],
            avatar: info[1],
            playing: this.getPeers({playing: true})!.length < this.#game.config.np
        });
        this.peers!.set(uid, peer);
        this.sync();
    }

    /** Get peers that match certain condition. */
    getPeers(filter: {[key: string]: any}) {
        if (!this.peers) {
            return null;
        }
        const peers = [];
        for (const peer of this.peers.values()) {
            let skip = false;
            for (const key in filter) {
                if (peer.get(key) !== filter[key]) {
                    skip = true;
                    continue;
                }
            }
            if (!skip) {
                peers.push(peer);
            }
        }
        return peers;
    }
}