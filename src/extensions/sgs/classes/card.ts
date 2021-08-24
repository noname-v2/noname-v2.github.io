import { Base } from './base';
import type { Link } from '../types';

interface CardLink extends Link {
    seat: number;
}

class Card extends Base<CardLink> {
    
}

export type { Card };
export const card = () => Card;