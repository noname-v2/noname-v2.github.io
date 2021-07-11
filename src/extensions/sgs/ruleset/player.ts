import type { Collection } from '../../extension';

export const player = <Collection>{
    choose: {
        content() {
            console.log('choose')
        }
    }
}