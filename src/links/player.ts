import { Link } from './link';
import type { SelectData } from '../types';

export interface PlayerData extends SelectData {
    /** Seat number. */
    seat: number;

    /** Name of the client controlling the player. */
    nickname: string;

    /** In-game identity. */
    identity: string;

    /** Name of the first hero. */
    heroName: string;

    /** Name of the second hero. */
    viceName: string;
}

export class Player extends Link<PlayerData> {
    
}