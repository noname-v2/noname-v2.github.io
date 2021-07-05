"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Owner = void 0;
const member_1 = require("./member");
const client_1 = require("./client");
class Owner extends client_1.Client {
    constructor() {
        super(...arguments);
        /** IDs of room members. */
        this.members = new Set();
    }
    /** Return client object if uid is a member. */
    get(uid) {
        const client = client_1.clients.get(uid);
        if (client instanceof member_1.Member && client.joined === this.uid) {
            return client;
        }
        return null;
    }
    /** Return all member client objects. */
    getAll() {
        const members = [];
        for (const uid of this.members) {
            const client = this.get(uid);
            if (client) {
                members.push(client);
            }
        }
        return members;
    }
    init(old, room) {
        this.edit(room);
        if (old instanceof Owner) {
            // send previously joined clients
            for (const client of old.getAll()) {
                client.join(this.uid);
            }
        }
        else if (old instanceof member_1.Member) {
            // notify previous room owner
            old.leave();
        }
    }
    /** Edit room info. */
    edit(room) {
        this.room = room;
        // notify room members
        if (room === null) {
            for (const client of this.getAll()) {
                client.leave('end');
            }
            this.ws.close(1000);
            client_1.clients.delete(this.uid);
        }
        // send room update to idle clients
        const msg = JSON.stringify({ [this.uid]: room });
        for (const client of client_1.clients.values()) {
            if (client instanceof member_1.Member && client.joined === null) {
                this.send('update', msg);
            }
        }
    }
    /** Remove a client from room. */
    kick(uid) {
        this.get(uid)?.leave('kicked');
    }
    /** Send a message to a client. */
    to(msg) {
        const [uid, msg2] = JSON.parse(msg);
        this.get(uid)?.send('msg', msg2);
    }
    /** Send a message to all clients. */
    bcast(msg) {
        for (const client of this.getAll()) {
            client.send('msg', msg);
        }
    }
    uninit() {
        this.bcast('down');
        // close room after 90s
        setTimeout(() => {
            if (this.ws === null) {
                this.edit(null);
            }
        });
    }
}
exports.Owner = Owner;
