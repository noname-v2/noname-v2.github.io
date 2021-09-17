import { Link, LinkData } from './link';

export interface PeerData extends LinkData {
    /** Player nickname. */
    nickname: string;

    /** Player avatar. */
    avatar: string;

    /** Playing in game (not spectating). */
    playing: boolean;

    /** Ready to start (if in lobby). */
    ready: boolean | [number, number];
}

export class Peer extends Link<PeerData> {

}