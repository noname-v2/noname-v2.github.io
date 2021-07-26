import type { Task, Link, Config, Dict } from '../sgs';

export function trigger(T: typeof Task): typeof Task {
    return class extends T {
        
    }
}