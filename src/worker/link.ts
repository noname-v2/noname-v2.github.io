import type { Dict } from '../utils';

/** A link to client component. */
export interface Link {
    /** Component ID. */
    readonly id: number;

    /** Component tag. */
    readonly tag: string;

    /** Call a component method. */
    readonly call: (method: string, arg?: any) => void;

    /** Update multiple properties. */
    readonly update: (items: Dict) => void;

    /** Remove reference to a component. */
    readonly unlink: () => void;

    [key: string]: any;
}