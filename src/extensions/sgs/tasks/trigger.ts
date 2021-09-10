import type { Task } from '../../types';

export function trigger(T: typeof Task) {
    return class Trigger extends T {
        /** Event name. */
        event!: string;

        main() {
            // console.log('>', this.event, this.parent?.path)
        }
    }
}