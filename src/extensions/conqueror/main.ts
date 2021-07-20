import type { SGS } from '../sgs/sgs';
import { hero } from './hero';
import { card } from './card';
import { skill } from './skill';

export default <SGS>{
    cardpack: '君临天下',
    heropack: '君临天下',
    tags: ['double-hidden!'],
    hero, card, skill
}