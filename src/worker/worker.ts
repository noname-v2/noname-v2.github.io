import { version } from '../version';
import { Game } from './game';
import { hub2owner } from '../hub/types';

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
            const room = [
                this.game?.getRule(this.game!.mode + ':mode').name,
                1, this.game?.config.np, this.info, this.game?.started
            ]
            ws.send('init:' + JSON.stringify([this.uid, this.info, room]));
        };
        ws.onmessage = ({data}) => {
            if (data === 'ready') {
                this.peers = new Map();
                this.sync();
            }
            else {
                try {
                    const idx = data.indexOf(':');
                    const method = data.slice(0, idx) as typeof hub2owner[number];
                    const arg = data.slice(idx + 1);
                    if (method === 'join') {
                        const [uid, info] = <[string, [string, string]]>JSON.parse(arg);
                        this.peers!.set(uid, info);
                        this.sync();
                        this.send(uid, this.game!.pack());
                        ////// stage === 3: send stage.calls
                    }
                    else if (method === 'leave') {
                        if (this.peers?.has(arg)) {
                            this.peers.delete(arg);
                            this.sync();
                        }
                    }
                    else if (method === 'resp') {
                        self.onmessage!(JSON.parse(arg));
                    }
                }
                catch (e) {
                    console.log(e, data);
                }
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
}