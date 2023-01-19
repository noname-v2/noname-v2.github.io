import { Component } from '../component';
import type { ClientSelect } from '../../types';

/** A component that can be the binding of a selection. */
export class Selectable extends Component {
    $select(cs: Partial<ClientSelect> | null, old?: Partial<ClientSelect>, partial?: boolean): void | Promise<void> {
        throw('$select is not implemented')
    }

    /** Make sure selected items are cleared before being removed. */
    remove() {
        super.remove((async () => {
            if (this.data.select !== null) {
                await this.$select(null, this.data.select)
            }
        })());
    }
}