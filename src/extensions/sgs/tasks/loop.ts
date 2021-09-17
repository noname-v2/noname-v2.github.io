import type { Task } from '../../../types';

export function loop(T: typeof Task) {
    return class Loop extends T {
        main() {
            console.log('loop');
        }
    }
}