import type { Accessor } from '../../../worker/accessor';
import { Card } from './card';
import { Player } from './player';
import { Skill } from './skill';

export function game(A: typeof Accessor) {
    return class Game extends A {
        players: Player[] = [];
        cards: Card[] = [];
        skills: Skill[] = [];

        backup() {

        }

        restore() {

        }

        test2() {
            console.log('test2')
        }
    } 
}