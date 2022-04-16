import { Component } from '../component';
import type { ClientSelect } from '../../types';

/** A component that can be the binding of a selection. */
export abstract class Selectable extends Component {
    abstract $select(cs: Partial<ClientSelect> | null, old?: Partial<ClientSelect>, partial?: boolean): void | Promise<void>;

    /** Remove with fade out animation. */
    remove() {
        if (this.removing) {
            return;
        }

        super.remove((async () => {
            if (this.data.select !== null) {
                await this.$select(null, this.data.select)
            }
        })());
    }
}