import type { Task } from '../../../types';

export function moveTo(T: typeof Task) {
    return class MoveTo extends T {
        main() {
            console.log('moveTo', this.np);
        }
    }
}