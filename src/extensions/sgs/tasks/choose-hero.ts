import type { TaskClass, Link, Config, Dict } from '../types';
import type { choose } from './choose';
import type { config } from '../config';

type A = typeof config

export function chooseHero(T: TaskClass) {
    return class ChooseHero extends (T as ReturnType<typeof choose>) {
        main() {
            console.log('chooseHero', this.np, this.select);
        }
    }
}