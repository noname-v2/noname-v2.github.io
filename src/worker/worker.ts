import { version } from '../version';
import { Game } from './game';
import { hub2owner } from '../hub/types';
import { split, Dict } from '../utils';
import type { Link } from './types';

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
 * 3: component return value (from yield() or respond())
 * 4: component return type (true: result from respond(), false: result from yield())
 */
export type ClientMessage = [string, number, number, any, boolean];

/**
 * Manager of component syncing between client and server.
 */
export class Worker {
    /** Worker version. */
    readonly version = version;

    /** User identifier. */
    readonly uid!: string;

    /** User nickname and avatar. */
    readonly info!: [string, string];

    /** Connected hub. */
    connection: WebSocket | null = null;

    /** Links of connected clients. */
    peers: Map<string, Link> | null = null;

    /** Ticked history items with timestamp. */
    #history: [number, UITick][] = [];

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
                (this as any).uid = data[0];
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
                if (peer[key] !== filter[key]) {
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

    /** Generate UITick(s) from this.#ticks. */
    #commit() {
        // split UITick by stage change
        const stages: [number, TickEntry[]][] = [];
        const now = Date.now();
        for (const entry of this.#ticks) {
            if (stages.length === 0 || stages[stages.length - 1][0] !== entry[0]) {
                stages.push([entry[0], []]);
            }
            stages[stages.length - 1][1].push(entry);
        }

        // generate UITick(s)
        for (const [stageID, entries] of stages) {
            const tagChanges: Dict<string | null> = {};
            const propChanges: Dict<Dict> = {};
            const calls: Dict<[string, any][]> = {};

            // merge updates from different ticks
            for (const [, id, item] of entries) {
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
            }

            // sync and save UITick
            const tick: UITick = [stageID, tagChanges, propChanges, calls];
            this.broadcast(tick);
            this.#history.push([now, tick]);
        }

        this.#ticks.length = 0;
    }

    /** Dispatch message from client. */
    async #dispatch(data: ClientMessage) {
        try {
            const [uid, sid, id, result, done] = data;
            const stage = this.#game.currentStage;
            const link = this.#game.links.get(id);
            if (id === -1) {
                // reload UI upon error
                this.send(uid, this.#game.pack());
            }
            else if (id === -2) {
                // disconnect from remote hub
                this.disconnect();
            }
            else if (sid === stage.id && link && link[1].owner === uid) {
                // send result to listener
                if (done && stage.awaits.has(id)) {
                    // results: component.respond() -> link.await()
                    const key = stage.awaits.get(id);
                    if (key) {
                        stage.results[key] = result;
                    }
                    stage.awaits.delete(id);
                    if (!stage.awaits.size) {
                        this.#game.loop();
                    }
                }
                else if (!done && stage.monitors.has(id)) {
                    // results: component.yield() -> link.monitor()
                    const method = stage.monitors.get(id)!;
                    (stage.task as any)[method](result, link[0]);
                }
            }
        }
        catch (e) {
            console.log(e);
        }
    }
}