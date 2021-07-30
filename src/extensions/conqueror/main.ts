import type { SGS } from '../sgs/types';
import { hero } from './hero';
import { card } from './card';
import { skill } from './skill';

export default {
    cardpack: '君临天下',
    heropack: '君临天下',
    tags: ['hero-hidden!', 'double-hero!'],
    hero, card, skill
} as SGS;