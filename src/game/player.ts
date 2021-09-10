import { Linked } from './linked';
import type { Link } from '../types';

export interface PlayerLink extends Link {
    seat: number;
    identity: string;
    heroName: string;
    viceName: string;
}

export class Player extends Linked<PlayerLink> {

}