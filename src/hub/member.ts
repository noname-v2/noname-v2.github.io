import type { Owner } from './owner';
import { Client, clients } from './client';

export class Member extends Client {
    /** Owner ID of currently joined room. */
    joined: string | null = null;

    get owner() {
        const owner = clients.get(this.joined) as Owner;
        if (owner?.members?.has(this.uid)) {
            return owner;
        }
        return null;
    }

    init(old: Owner | Member | null) {
        if (old instanceof Member) {

        }
        else if (old) {

        }
    }

    uninit() {
        
    }

    join(uid: string) {
        
    }

    leave(reason: string | null = null) {
        // notify room owner
        if (this.joined) {
            const owner = this.owner;
            if (owner) {
                owner.send('leave', this.uid);
                owner.members.delete(this.uid);
            }
        }

        if (this.ws.CLOSED) {
            // delete closed client without a room
            clients.delete(this.uid);
        }
        else {
            // send room list
            this.reload(reason);
        }
    }

    reload(reason: string | null = null) {

    }
}