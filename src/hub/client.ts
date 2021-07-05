import WebSocket from 'ws';
import type { Owner } from './owner';
import type { Member } from './member';

export const clients = new Map<string, Owner | Member>();

export abstract class Client {
    // WebSocket object
    ws: WebSocket;

    // client unique identifier
    uid: string;

    // client description
    info: any;

    // tested by heartbeat
    alive = true;

    constructor(...args: [WebSocket, string, any]) {
        [this.ws, this.uid, this.info] = args;
    }

    abstract init(old:  Owner | Member | null, room?: any): void;

    abstract uninit(): void;

    send(tag: string, msg: string, stringify: boolean = false) {
        this.ws.send(tag + ':' + (stringify ? JSON.stringify(msg) : msg));
    }
}