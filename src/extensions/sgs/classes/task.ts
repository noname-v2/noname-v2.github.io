import type { Task } from '../../../game/task';
import type { Game, TaskClass } from '../types';
import { Card } from './card';
import { Player } from './player';
import { Skill } from './skill';


export function task(T: typeof Task) {
    return class Task extends T<Game> {
        test() {
            console.log('test1')
        }
    } 
}