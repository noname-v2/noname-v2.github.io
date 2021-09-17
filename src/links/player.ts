import { Link, LinkData } from './link';

export interface PlayerData extends LinkData {
    seat: number;
    nickname: string;
    identity: string;
    heroName: string;
    viceName: string;
}

export class Player extends Link<PlayerData> {

}