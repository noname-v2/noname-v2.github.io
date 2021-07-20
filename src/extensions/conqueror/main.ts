import type { Extension } from '../extension';
import { hero } from './hero';
import { card } from './card';
import { skill } from './skill';

export default <Extension>{
    cardpack: '君临天下',
    heropack: '君临天下',
    tags: ['double-hidden!'],
    hero, card, skill
}