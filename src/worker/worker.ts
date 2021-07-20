import { version } from '../version';
import { Game } from './game';
import { hub2owner, split } from '../hub/types';

/** An update to client side. */
export type UITick = [
    // stage ID
    number,
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

    /** Game object. */
    game: Game | null = null;

    /** Connected hub. */
    connection: WebSocket | null = null;

    /** IDs of connected clients. */
    peers: Map<string, [string, string]> | null = null;

    /** Clients updated since last UITick. */
    syncPending = false;

    /** Room info listed in the hub. */
    get room() {
        return JSON.stringify([
            // mode name
            this.game!.getRule(this.game!.mode + ':mode').name,
            // joined clients
            this.peers!.size,
            // number of players in a game
            this.game!.config.np,
            // nickname and avatar of owner
            this.info,
            // game state
            this.game!.state
        ]);
    }

    /**
     * Setup communication.
     */
    constructor() {
        self.onmessage = ({data}: {data: ClientMessage}) => {
            this.uid = data[0];
            this.game = new Game(data[3], this);
        }
        (self as any).postMessage('ready');
    }

    /** Send a message to all clients. */
    broadcast(tick: UITick) {
        if (this.game && this.connection) {
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
        else if (this.game && this.connection) {
            // send tick to a remote client
            this.connection.send('to:' + JSON.stringify([
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
            this.peers = null;
            this.sync();
        };
        ws.onopen = () => {
            this.peers = new Map();
            this.peers.set(this.uid, this.info);
            ws.send('init:' + JSON.stringify([this.uid, this.info, this.room]));
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
        if (this.game!.tickable) {
            this.game!.arena.update({
                peers: this.peers ? Object.fromEntries(this.peers) : null
            });
            this.syncPending = false;
        }
        else {
            this.syncPending = true;
        }
    }

    /** The room is ready for clients to join. */
    ready() {
        this.sync();
    }

    /** A remote client joins the room. */
    join(msg: string) {
        const [uid, info] = <[string, [string, string]]>JSON.parse(msg);
        this.peers!.set(uid, info);
        this.sync();
        this.updateRoom();
        this.send(uid, this.game!.pack());
        ////// stage === 3: send stage.calls
    }

    /** A remote client leaves the room. */
    leave(uid: string) {
        if (this.peers?.has(uid)) {
            this.peers.delete(uid);
            this.sync();
            this.updateRoom();
        }
    }

    /** A remote client sends a response message. */
    resp(msg: string) {
        self.onmessage!(JSON.parse(msg));
    }

    /** Update room info for idle clients. */
    updateRoom() {
        this.connection?.send('edit:' + this.room);
    }
}