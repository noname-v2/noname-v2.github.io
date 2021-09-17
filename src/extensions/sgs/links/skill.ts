import { Skill } from '../../../links/link';

export function skill(S: typeof Skill) {
    return class Skill extends S {
        test() {
            // this.createPlayer();
        }
    }
}