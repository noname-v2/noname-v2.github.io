import { Owner } from './owner';
import { Client, clients } from './client';
import type { hub2member } from './types';

export class Member extends Client {
    /** Owner ID of currently joined room. */
    joined: string | null = null;

    /** Overwrite type annotation for send. */
    send: (tag: typeof hub2member[number], msg?: string) => void;

    /** Getter of room owner. */
    get owner() {
        const owner = clients.get(this.joined);
        if (owner instanceof Owner && owner.members?.has(this.uid)) {
            return owner;
        }
        return null;
    }

    init(old: Owner | Member | null) {
        if (old instanceof Member && old.owner && !old.owner.closed) {
            // rejoin previous room
            this.join(old.joined);
        }
        else if (old instanceof Owner) {
            // close old room
            old.edit('close');
        }

        if (!this.joined) {
            // send room list
            this.reload('init');
        }
    }

    /** Join a room. */
    join(uid: string) {
        const owner = clients.get(uid);
        if (owner instanceof Owner && (!this.owner || this.joined === uid)) {
            this.joined = uid;
            owner.members.add(this.uid);
            owner.send('join', JSON.stringify([this.uid, this.info]));
        }
    }

    /** Leave currently joined room. */
    leave(reason: 'end' | 'kick' | 'init' | null = null) {
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

    /** Update info. */
    set(msg: string) {
        this.info = JSON.parse(msg);
    }

    /** Send full room list to client. */
    reload(reason: 'end' | 'kick' | 'init') {
        const rooms = {};
        for (const client of clients.values()) {
            if (client instanceof Owner && !client.closed) {
                rooms[client.uid] = client.room;
            }
        }
        this.send('reload', reason + ':' + JSON.stringify(rooms));
    }

    /** Send a response message to the owner of the room. */
    resp(msg: string) {
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