import type { Task, Link, Config, Dict } from '../sgs';

export function trigger(T: typeof Task) {
    return class Trigger extends T {
        /** Event name. */
        event!: string;

        main() {
            // console.log('>', this.event, this.parent?.path)
        }
    }
}