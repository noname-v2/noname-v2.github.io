import { Client } from './client';

export class Owner extends Client {
    /** Room description. */
    room: any;

    /** IDs of room members. */
    members = new Set<string>();

    constructor(room: any, ...args: [WebSocket, string, any]) {
        super(...args);
        this.room = room;
    }
}