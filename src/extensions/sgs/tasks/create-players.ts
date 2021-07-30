import type { TaskClass, Link, Config, Dict } from '../types';

export function createPlayers(T: TaskClass) {
    return class ChoosePlayer extends T {
        main() {
            console.log('createPlayers');
        }
    }
}