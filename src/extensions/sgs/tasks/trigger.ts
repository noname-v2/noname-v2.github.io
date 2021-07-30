import type { TaskClass, Link, Config, Dict } from '../types';

export function trigger(T: TaskClass) {
    return class Trigger extends T {
        /** Event name. */
        event!: string;

        main() {
            // console.log('>', this.event, this.parent?.path)
        }
    }
}