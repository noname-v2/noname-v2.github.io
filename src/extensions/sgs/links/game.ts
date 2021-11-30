import type { Arena } from '../../../types-worker';

export function arena(A: typeof Arena) {
    return class Arena extends A {
        /** Backup game progress. */
        backup() {
            
        }

        /** Restore game progress. */
        restore() {

        }
    } 
}