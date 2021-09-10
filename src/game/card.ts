import { Linked } from './linked';
import type { Link } from '../types';

export interface CardLink extends Link {
    name: string;
    suit: string;
    number: number;
    label?: string[];
}

export class Card extends Linked<CardLink> {

}