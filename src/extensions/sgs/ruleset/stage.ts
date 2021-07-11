import type { Collection } from '../../extension';

export const stage = <Collection>{
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