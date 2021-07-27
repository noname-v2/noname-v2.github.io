import { version } from '../version';
import { Game } from './game';
import { hub2owner } from '../hub/types';
import { split, Dict } from '../utils';
import type { Link } from './link';

/** An update to client side. */
export type UITick = [
    // stage ID
    number,
    // add or delete components
    Dict<string | null>,
    // component property updates
    Dict<Dict>,
    // component function calls
    Dict<[string, any][]>
];

/** One section of a UITick. */
type TickItem = string | null | Dict | [string, any];

/** Stage ID, component ID and UITick section. */
type TickEntry = [number, number, TickItem];

/** Client-side message.
 * 0: uid
 * 1: stage ID
 * 2: component ID
 * 3: component return value (from yield() or return())
 * 4: component return type (true: result from return(), false: result from yield())
 */
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

    /** Ticked history items with timestamp. */
    #history: [number, TickItem][] = [];

    /** Entries to be ticked. */
    #ticks: TickEntry[] = [];

    /** Game object. */
    #game!: Game;

    /**
     * Setup communication.
     */
    constructor() {
        self.onmessage = ({data}: {data: ClientMessage}) => {
            if (data[1] === 0) {
                self.onmessage = ({data}: {data: ClientMessage}) => this.#dispatch(data);
                this.uid = data[0];
                this.#game = new Game(data[3], this);
            }
        }
        (self as any).postMessage('ready');
    }

    /** Send a message to all clients. */
    broadcast(tick: UITick) {
        if (this.peers) {
            // broadcast tick
            this.connection!.send('bcast:' + JSON.stringify(tick));
        }
        (self as any).postMessage(tick);
    }

    /** Send a message to a client. */
    send(uid: string, tick: UITick) {
        if (uid === this.uid) {
            (self as any).postMessage(tick);
        }
        else if (this.peers) {
            // send tick to a remote client
            this.connection!.send('to:' + JSON.stringify([
                uid, JSON.stringify(tick)
            ]))
        }
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
                if (this.peers) {
                    for (const peer of this.peers.values()) {
                        peer.unlink();
                    }
                }
                this.peers = null;
                this.sync();
            }
        };
        ws.onopen = () => {
            ws.send('init:' + JSON.stringify([this.uid, this.info, this.#game.syncRoom(false)]));
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
        const [uid, info]: [string, [string, string]] = JSON.parse(msg);
        this.createPeer(uid, info);
        this.#game.syncRoom();
        this.send(uid, this.#game.pack());
    }

    /** A remote client leaves the room. */
    leave(uid: string) {
        if (this.peers?.has(uid)) {
            this.peers.get(uid)!.unlink();
            this.peers.delete(uid);
            this.sync();
            this.#game.syncRoom();
        }
    }

    /** A remote client sends a response message. */
    resp(msg: string) {
        this.#dispatch(JSON.parse(msg));
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
    getPeers(filter?: Dict) {
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

    /** Add component update (called by Link). */
    tick(id: number, item: TickItem) {
        if (this.#ticks.length === 0) {
            // schedule a UITick if no pending UITick exists
            setTimeout(() => this.#commit());
        }
        this.#ticks.push([this.#game.currentStage.id, id, item]);
    }

    /** Create UITick(s) from this.#history. */
    #commit() {
        let stageID: number | null = -1;
        let tagChanges: Dict<string | null> = {};
        let propChanges: Dict<Dict> = {};
        let calls: Dict<[string, any][]> = {};

        // save current timestamp in this.#history
        const now = Date.now();

        for (const entry of this.#ticks) {
            const [sid, id, item] = entry;

            // split UITick by stage change
            if (sid !== stageID) {
                if (stageID !== -1) {
                    this.broadcast([stageID, tagChanges, propChanges, calls]);
                    tagChanges = {}
                    propChanges = {};
                    calls = {};
                }
                stageID = sid;
            }

            // merge history entries into a single UITick
            if (Array.isArray(item)) {
                calls[id] ??= [];
                calls[id].push(item);
            }
            else if (item && typeof item === 'object') {
                propChanges[id] ??= {};
                Object.assign(propChanges[id], item);
            }
            else {
                tagChanges[id] = item;
            }

            this.#history.push([now, entry]);
        }

        this.broadcast([stageID, tagChanges, propChanges, calls]);
        this.#ticks.length = 0;
    }

    /** Dispatch message from client. */
    async #dispatch(data: ClientMessage) {
        try {
            const [uid, sid, id, result, done] = data;
            const stage = this.#game.currentStage;
            if (id < 0) {
                // reload UI upon error
                this.send(uid, this.#game.pack());
            }
            else if (sid === stage.id && this.#game.links.get(id)?.owner === uid) {
                // send result to listener
                if (done && stage.awaits.has(id)) {
                    // results: component.return() -> link.await()
                    const key = stage.awaits.get(id);
                    if (key) {
                        stage.results[key] = result;
                    }
                    stage.awaits.delete(id);
                    if (!stage.awaits.size && this.#game.paused) {
                        this.#game.loop();
                    }
                }
                else if (!done && stage.monitors.has(id)) {
                    // results: component.yield() -> link.monitor()
                    const task = stage.task;
                    const link = this.#game.links.get(id);
                    if (task && link) {
                        const method = stage.monitors.get(id)!;
                        (stage.task as any)[method](result, link);
                    }
                }
            }
        }
        catch (e) {
            console.log(e);
        }
    }
}