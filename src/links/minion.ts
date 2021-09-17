import { Link, LinkData } from './link';

export interface MinionData extends LinkData {
    name: string;
}

export class Minion extends Link<MinionData> {

}