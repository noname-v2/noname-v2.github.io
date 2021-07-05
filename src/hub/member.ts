import type { Owner } from './owner';
import { Client, clients } from './client';

export class Member extends Client {
    /** Owner ID of currently joined room. */
    joined: string | null = null

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
}