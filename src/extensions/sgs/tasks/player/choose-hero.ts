import type { choose } from './choose';

export function chooseHero(T: ReturnType<typeof choose>) {
    return class ChooseHero extends T {
        main() {
            console.log('chooseHero', this.np, this.select);
        }
    }
}