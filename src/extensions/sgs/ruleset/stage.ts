import type { CollectionSGS } from '../sgs';

export const stage = <CollectionSGS>{
    before: {
        async content() {

        }
    },
    main: {
        async content() {
            await this.getRule().apply(this);
        }
    },
    after: {
        async content() {
            
        }
    }
};