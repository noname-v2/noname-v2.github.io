import type { TaskClass, Link, Config, Dict } from '../types';

export function setup(T: TaskClass) {
    return class Setup extends T {
        main() {
            console.log(this, this.game, this.game.test2);
        }

        createPlayers() {

        }

        createCards() {

        }
    }
}