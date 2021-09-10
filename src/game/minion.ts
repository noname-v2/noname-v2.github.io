import { Linked } from './linked';
import type { Link } from '../types';

export interface MinionLink extends Link {
    name: string;
}

export class Minion extends Linked<MinionLink> {

}