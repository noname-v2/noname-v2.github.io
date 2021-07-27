import type { Task, Link, Config, Dict } from '../sgs';
import type { choose } from './choose';
import type { config } from '../config';

type A = typeof config

export function chooseHero(T: typeof Task): typeof Task {
    return class ChooseHero extends (T as ReturnType<typeof choose>) {
        main() {
            console.log('chooseHero', this.np);
        }
    }
}