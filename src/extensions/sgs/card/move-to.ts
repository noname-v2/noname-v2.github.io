import type { TaskClass } from '../types';

export function moveTo(T: TaskClass) {
    return class MoveTo extends T {
        main() {
            console.log('moveTo', this.np);
        }
    }
}