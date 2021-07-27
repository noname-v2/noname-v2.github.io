import type { SGS } from '../sgs/sgs';
import { hero } from './hero';
import { card } from './card';
import { skill } from './skill';
import { pile } from './pile';

export default {
    cardpack: '标准',
    heropack: '标准',
    hero, card, skill, pile
} as SGS;