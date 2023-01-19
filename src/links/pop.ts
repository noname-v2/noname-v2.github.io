import { Link } from './link';
import type { SelectData } from '../types';


export interface PopData extends SelectData {
    name: string;
    suit: string;
    number: number;
    label?: string[];
}

export class Pop extends Link<PopData> {

}