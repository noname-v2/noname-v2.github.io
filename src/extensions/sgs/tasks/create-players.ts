import type { Task, Link, Config, Dict } from '../sgs';

export function createPlayers(T: typeof Task) {
    return class ChoosePlayer extends T {
        main() {
            console.log('createPlayers');
        }
    }
}