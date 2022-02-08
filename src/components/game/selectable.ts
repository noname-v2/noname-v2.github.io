import { Component } from '../component';
import type { ClientSelect } from '../../types';

/** A component that can be the binding of a selection. */
export abstract class Selectable extends Component {
    abstract $select(cs: ClientSelect | null): void;
}