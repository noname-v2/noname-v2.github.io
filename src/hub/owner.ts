import { Member } from './member';
import { Client, clients } from './client';

export class Owner extends Client {
    /** Room description. */
    room!: any;

    /** IDs of room members. */
    members = new Set<string>();

    get clients() {
        const members = <Member[]>[];
        for (const uid of this.members) {
            const client = clients.get(uid);
            if (client instanceof Member && client.joined === this.uid) {
                members.push(client);
            }
        }
        return members;
    }

    init(old: Owner | Member | null, room: any) {
        this.edit(room);

        // notify owner about previously joined clients
        if (old instanceof Owner) {
            for (const client of old.clients) {
                client.join(this.uid);
            }
        }
    }

    edit(room: any) {
        this.room = room;

        // notify room members
        if (room === null) {
            for (const client of this.clients) {
                client.leave('end');
            }
            this.ws.close(1000);
        }

        // send room update to idle clients
        const msg = JSON.stringify({[this.uid]: room});
        for (const client of clients.values()) {
            if (client instanceof Member && client.joined === null) {
                this.send('update', msg);
            }
        }
    }

    bcast(msg: string) {

    }

    uninit() {
        
    }
}