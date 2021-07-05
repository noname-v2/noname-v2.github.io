import { Owner } from './owner';
import { Client, clients } from './client';

export class Member extends Client {
    /** Owner ID of currently joined room. */
    joined: string | null = null;

    /** Getter of room owner. */
    get owner() {
        const owner = clients.get(this.joined);
        if (owner instanceof Owner && owner.members?.has(this.uid)) {
            return owner;
        }
        return null;
    }

    init(old: Owner | Member | null) {
        if (old instanceof Member) {
            // rejoin previous room
            if (old.owner) {
                this.join(old.joined);
            }
        }
        else if (old instanceof Owner && old.members.size) {
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
    join(uid: string) {
        if (this.owner) {
            return;
        }
        const owner = clients.get(uid);
        if (owner instanceof Owner) {
            this.joined = uid;
            owner.members.add(uid);
            owner.send('join', this.uid);
        }
    }

    /** Leave currently joined room. */
    leave(reason: string | null = null) {
        // notify room owner
        const owner = this.owner;
        if (owner) {
            owner.send('leave', this.uid);
            owner.members.delete(this.uid);
        }

        if (reason) {
            if (this.ws.CLOSED) {
                // delete closed client without a room
                if (clients.get(this.uid) === this) {
                    clients.delete(this.uid);
                }
            }
            else {
                // send room list
                this.reload(reason);
            }
        }
    }

    /** Send full room list to client. */
    reload(reason: string) {
        const rooms = {};
        for (const client of clients.values()) {
            if (client instanceof Owner) {
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
            owner.send('down', this.uid);
        }
        else {
            clients.delete(this.uid);
        }
    }
}