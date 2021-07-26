import type { SGS } from '../sgs/sgs';
import { hero } from './hero';
import { card } from './card';
import { skill } from './skill';

export default <SGS>{
    mode: {
        name: '国战',
        np: [2, 3, 4, 5, 6, 7, 8],
        inherit: 'sgs'
    },
    heropack: '国战标准',
    cardpack: '国战标准',
    tags: ['guess-side', 'double-hidden!'],
    hero, card, skill
}