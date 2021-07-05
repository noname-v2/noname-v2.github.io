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
    get(uid) {
        const client = client_1.clients.get(uid);
        if (client instanceof member_1.Member && client.joined === this.uid) {
            return client;
        }
        return null;
    }
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
        // notify owner about previously joined clients
        if (old instanceof Owner) {
            for (const client of old.getAll()) {
                client.join(this.uid);
            }
        }
    }
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
    kick(uid) {
        this.get(uid)?.leave('kicked');
    }
    to(msg) {
        const [uid, msg2] = JSON.parse(msg);
        this.get(uid)?.send('msg', msg2);
    }
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
