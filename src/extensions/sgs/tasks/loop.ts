import type { TaskClass, Link, Config, Dict } from '../types';

export function loop(T: TaskClass) {
    return class Loop extends T {
        main() {
            console.log('loop');
        }
    }
}