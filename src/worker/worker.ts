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

    /** Game object. */
    game: Game | null = null;

    /** Connected hub. */
    connection: WebSocket | null = null;

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
}