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
    /** Getter of room owner. */
    get owner() {
        const owner = client_1.clients.get(this.joined);
        if (owner instanceof owner_1.Owner && owner.members?.has(this.uid)) {
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
        else if (old instanceof owner_1.Owner && old.members.size) {
            // disallow an active room owner to join another game
            this.ws.close(1008, 'old');
            return;
        }
        if (!this.joined) {
            // send room list
            this.reload('init');
        }
    }
    /** Join a room. */
    join(uid) {
        const owner = client_1.clients.get(uid);
        if (owner instanceof owner_1.Owner && (!this.owner || this.joined === uid)) {
            this.joined = uid;
            owner.members.add(this.uid);
            owner.send('join', JSON.stringify([this.uid, this.info]));
        }
    }
    /** Leave currently joined room. */
    leave(reason = null) {
        // notify room owner
        const owner = this.owner;
        if (owner && reason !== 'end') {
            owner.send('leave', this.uid);
            owner.members.delete(this.uid);
            owner.bcastMembers.delete(this.uid);
        }
        this.joined = null;
        if (reason) {
            if (this.closed) {
                // delete closed client with no room
                this.remove();
            }
            else {
                // send room list
                this.reload(reason);
            }
        }
    }
    /** Send full room list to client. */
    reload(reason) {
        const rooms = {};
        for (const client of client_1.clients.values()) {
            if (client instanceof owner_1.Owner && !client.closed) {
                rooms[client.uid] = client.room;
            }
        }
        this.send('reload', reason + ':' + JSON.stringify(rooms));
    }
    /** Send a response message to the owner of the room. */
    resp(msg) {
        this.owner?.send('resp', msg);
    }
    uninit() {
        const owner = this.owner;
        if (owner) {
            owner.send('leave', this.uid);
            owner.bcastMembers.delete(this.uid);
        }
        else {
            this.remove();
        }
    }
}
exports.Member = Member;
