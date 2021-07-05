"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Member = void 0;
const owner_1 = require("./owner");
const client_1 = require("./client");
class Member extends client_1.Client {
    constructor() {
        super(...arguments);
        /** Owner ID of currently joined room. */
        this.joined = null;
    }
    get owner() {
        const owner = client_1.clients.get(this.joined);
        if (owner instanceof owner_1.Owner && owner?.members?.has(this.uid)) {
            return owner;
        }
        return null;
    }
    init(old) {
        if (old instanceof Member) {
            // rejoin previous room
            if (old.owner) {
                this.join(old.joined);
            }
        }
        else if (old && old.members.size) {
            // disallow an active room owner to join another game
            this.ws.close(1008, 'old');
            return;
        }
        if (!this.joined) {
            // send room list
            this.reload();
        }
    }
    join(uid) {
        if (this.owner) {
            return;
        }
        const owner = client_1.clients.get(uid);
        if (owner?.members) {
            this.joined = uid;
            owner.members.add(uid);
            owner.send('join', this.uid);
        }
    }
    leave(reason = null) {
        // notify room owner
        const owner = this.owner;
        if (owner) {
            owner.send('leave', this.uid);
            owner.members.delete(this.uid);
        }
        if (this.ws.CLOSED) {
            // delete closed client without a room
            client_1.clients.delete(this.uid);
        }
        else {
            // send room list
            this.reload(reason);
        }
    }
    reload(reason = null) {
        const rooms = {};
        for (const client of client_1.clients.values()) {
            if (client instanceof Member) {
                continue;
            }
            if (client.room) {
                rooms[client.uid] = client.room;
            }
        }
        this.send('reload', reason + ':' + JSON.stringify(rooms));
    }
    uninit() {
        const owner = this.owner;
        if (owner) {
            owner.send('down', this.uid);
        }
        else {
            client_1.clients.delete(this.uid);
        }
    }
}
exports.Member = Member;
