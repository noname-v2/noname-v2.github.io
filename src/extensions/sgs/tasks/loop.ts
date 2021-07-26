import type { Task, Link, Config, Dict } from '../sgs';

export function loop(T: typeof Task): typeof Task {
    return class extends T {
        main() {
            console.log('loop');
        }
    }
}