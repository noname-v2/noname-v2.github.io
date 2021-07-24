import type { Collection } from '../sgs';

export const stage = <Collection>{
    before: {
        async content() {

        }
    },
    main: {
        async content() {
            await this.game.getRule(this.path).call(this);
        }
    },
    after: {
        async content() {
            
        }
    }
};