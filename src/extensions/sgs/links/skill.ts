import { Skill } from '../../../types-worker';

export function skill(S: typeof Skill) {
    return class Skill extends S {
        test() {
            // this.createPlayer();
        }
    }
}