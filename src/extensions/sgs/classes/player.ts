import { Base } from './base';
import type { Link } from '../types';

export interface PlayerLink extends Link {
    seat: number;
    identity: string;
    heroName: string;
    viceName: string;
}

class Player extends Base<PlayerLink> {
    
}

export type { Player };
export const player = () => Player;