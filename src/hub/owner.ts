import { Member } from './member';
import { Client, clients } from './client';

export class Owner extends Client {
    /** Room description. */
    room!: any;

    /** IDs of room members. */
    members = new Set<string>();

    /** Return client object if uid is a member. */
    private get(uid: string) {
        const client = clients.get(uid);
        if (client instanceof Member && client.joined === this.uid) {
            return client;
        }
        return null;
    }

    /** Return all member client objects. */
    private getAll() {
        const members = <Member[]>[];
        for (const uid of this.members) {
            const client = this.get(uid);
            if (client) {
                members.push(client);
            }
        }
        return members;
    }

    init(old: Owner | Member | null, room: any) {
        this.edit(room);

        if (old instanceof Owner) {
            // send previously joined clients
            for (const client of old.getAll()) {
                client.join(this.uid);
            }
        }
        else if (old instanceof Member) {
            // notify previous room owner
            old.leave();
        }
    }

    /** Edit room info. */
    edit(room: any) {
        this.room = room;

        // notify room members
        if (room === null) {
            for (const client of this.getAll()) {
                client.leave('end');
            }
            this.ws.close(1000);
            this.remove();
        }

        // send room update to idle clients
        const msg = JSON.stringify({[this.uid]: room});
        for (const client of clients.values()) {
            if (client instanceof Member && client.joined === null) {
                this.send('edit', msg);
            }
        }
    }

    /** Remove a client from room. */
    kick(uid: string) {
        this.get(uid)?.leave('kick');
    }

    /** Send a message to a client. */
    to(msg: string) {
        const [uid, msg2] = JSON.parse(msg);
        this.get(uid)?.send('msg', msg2);
    }

    /** Send a message to all clients. */
    bcast(msg: string) {
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
        }, 90000);
    }
}