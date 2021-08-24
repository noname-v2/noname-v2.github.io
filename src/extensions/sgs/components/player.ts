import type { Player } from '../../../components';
import type { PlayerLink } from '../classes/player';

export function player(T: typeof Player) {
    return class PlayerSGS extends T {
        declare data: PlayerLink;
        
        x!: number;
        y!: number;

        locate(dx=0, dy=0) {
            this.node.style.transform = `translate(${this.x + dx}px,${this.y + dy}px)`;
        }

        $seat(seat?: number) {
            seat ??= this.data.seat;
            [this.x, this.y] = this.app.arena!.locatePlayer(seat);
            this.locate();
        }
    }
}