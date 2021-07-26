import type { Task, Link, Config, Dict } from '../sgs';

export function chooseHero(T: typeof Task): typeof Task {
    return class extends T {
        
    }
}