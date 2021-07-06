import { version } from '../version';
import { Game } from './game';


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
    clients: Map<string, [string, string]> | null = null;

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
        }
        this.tick(tick);
    }

    /** Send a message to a client. */
    send(uid: string, tick: UITick) {
        if (this.game && this.connection) {
            // send tick to a client
        }
        else if (uid === this.uid) {
            this.tick(tick);
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
                this.clients = new Map();
                this.clients.set(this.uid, this.info);
                ws.onclose = () => {
                    if (this.connection === ws) {
                        this.connection = null;
                    }
                    this.sync();
                }
                this.sync();
            }
            else {
                const idx = data.indexOf(':');
                const method = data.slice(0, idx);
                const arg = data.slice(idx + 1);
                if (method === 'join') {

                }
            }
        };
    }

    /** Disconnect from remote hub. */
    disconnect() {
        this.clients = null;
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
            for (const link of this.game!.links.values()) {
                if (link.syncing) {
                    const ws = this.connection;
                    link.update({
                        clients: this.clients ? Object.fromEntries(this.clients) : null,
                        connected: (ws && ws.readyState === ws.OPEN) ? true : false
                    });
                }
            }
            this.syncPending = false;
        }
        else {
            this.syncPending = true;
        }
    }
}