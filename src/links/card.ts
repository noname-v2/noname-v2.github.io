import { Link, LinkData } from './link';

export interface CardData extends LinkData {
    name: string;
    suit: string;
    number: number;
    label?: string[];
}

export class Card extends Link<CardData> {

}