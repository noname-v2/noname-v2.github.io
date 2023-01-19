import { Choose } from './choose';
import type { Select, Pop, Player } from '../types-worker';

export interface PopSelect {
    
}

export class ChoosePop extends Choose {
    pops!: Map<Player, Partial<Select>>;

    main() {
        this.selects = new Set();

        for (const [player, pop] of this.pops) {
            const select = this.utils.copy(pop) as Select;
            select.task = this;
            select.target = this.arena.create('pop');
            select.target.data.owner = player.owner;
            select.items = []
            this.selects.add(select);
        }

        super.main();
    }
}