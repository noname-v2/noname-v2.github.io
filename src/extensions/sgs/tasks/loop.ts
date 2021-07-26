import type { Task, Link, Config, Dict } from '../sgs';

export function loop(T: typeof Task): typeof Task {
    return class Loop extends T {
        main() {
            console.log('loop');
        }
    }
}