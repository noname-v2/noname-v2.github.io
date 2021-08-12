import type { TaskClass, Link, Config, Dict } from '../../types';

export function choose(T: TaskClass) {
    return class Choose extends T {
        main() {
            console.log('choose', this.np);
        }

        select(key: string) {

        }
    }
}