import type { Player } from '../../../components';

export function player(T: typeof Player) {
    return class PlayerSGS extends T {
        x!: number;
        y!: number;

        locate(dx=0, dy=0) {
            this.node.style.transform = `translate(${this.x + dx}px,${this.y + dy}px)`;
        }

        $seat(seat?: number) {
            seat ??= this.get('seat');
            [this.x, this.y] = this.app.arena!.locatePlayer(seat);
            this.locate();
        }
    }
}