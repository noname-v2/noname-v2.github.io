import type WebSocket from 'ws';
import type { Owner } from './owner';
import type { Member } from './member';

export const clients = new Map<string, Owner | Member>();

export abstract class Client {
    // WebSocket object
    ws: WebSocket | null;

    // client unique identifier
    uid: string;

    // client description
    info: any;

    // tested by heartbeat
    alive = true;

    constructor(...args: [WebSocket, string, any]) {
        [this.ws, this.uid, this.info] = args;
        clients.set(this.uid, this as any);
    }

    /** Initialize after object created. */
    abstract init(old:  Owner | Member | null, room?: any): void;

    /** Handle WebSocket close. */
    abstract uninit(): void;

    send(tag: string, msg?: string) {
        this.ws.send(tag + (msg ? ':' + msg : ''));
    }

    remove() {
        if (clients.get(this.uid) as any === this) {
            clients.delete(this.uid);
        }
    }
}