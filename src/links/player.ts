import { Link, LinkData } from './link';
import type { ClientSelect } from '../types';

export interface PlayerData extends LinkData {
    seat: number;
    nickname: string;
    identity: string;
    heroName: string;
    viceName: string;
    select: ClientSelect | null;
}

export class Player extends Link<PlayerData> {

}