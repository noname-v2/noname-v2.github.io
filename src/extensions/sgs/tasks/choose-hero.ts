import type { Task, Link, Config, Dict } from '../sgs';

export function chooseHero(T: typeof Task): typeof Task {
    return class ChooseHero extends T {
        np!: number;

        main() {
            console.log('chooseHero', this.np);
        }
    }
}