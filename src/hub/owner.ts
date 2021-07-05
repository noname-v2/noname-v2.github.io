import type { Member } from './member';
import { Client, clients } from './client';

export class Owner extends Client {
    /** Room description. */
    room!: any;

    /** IDs of room members. */
    members = new Set<string>();

    init(old: Owner | Member | null, room: any) {
        this.edit(room);

        // let members of previous rooms join
        if (old instanceof Owner) {
            for (const uid of old.members) {
                const client = clients.get(uid) as Member;
                if (client?.joined === this.uid) {
                    client.join(this.uid);
                }
            }
        }
    }

    edit(room: any) {
        this.room = room;

        if (room === null) {
            this.bcast('end');
            this.ws.close(1000);
        }

        
    }

    bcast(msg: string) {

    }

    uninit() {
        
    }
}