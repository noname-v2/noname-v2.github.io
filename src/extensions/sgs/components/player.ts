import { Player } from '../../../components/component';

export function player(T: typeof Player) {
    return class Player extends T {
        x!: number;
        y!: number;

        locate(dx=0, dy=0) {
            this.node.style.transform = `translate(${this.x + dx}px,${this.y + dy}px)`;
        }

        $seat(seat?: number) {
            seat ??= this.data.seat;
            // @ts-ignore
            [this.x, this.y] = this.app.arena!.locatePlayer(seat);
            this.locate();
            if (!this.data.heroName) {
                this.$heroName(`@(${seat!+1})号位`);
            }
        }
    }
}