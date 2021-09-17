import type { Arena } from '../../../links/link';

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