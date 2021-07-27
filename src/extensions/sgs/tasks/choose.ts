import type { Task, Link, Config, Dict } from '../sgs';

export function choose(T: typeof Task) {
    return class ChooseHero extends T {
        main() {
            console.log('choose', this.np);
        }

        select(key: string) {

        }
    }
}