import { room } from './globals';
import { tick } from './worker';
import type { Dict } from '../types';

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

export function createLink(id: number, tag: string) {
    const obj: Dict = {};

    // reserved link keys
    const reserved: Link = {
        id, tag,
        call(method: string, arg?: any) {
            tick(id, [method, arg]);
        },
        unlink() {
            tick(id, null);
            room.links.delete(id);
        },
        update(items: Dict) {
            for (const key in items) {
                const val = items[key] ?? null;
                val === null ? delete obj[key] : obj[key] = val;
            }
            tick(id, items);
        }
    };

    const link = new Proxy(obj, {
        get(_, key: string) {
            if (key in reserved) {
                return reserved[key];
            }
            else {
                return obj[key];
            }
        },
        set(_, key: string, val: any) {
            if (key in reserved) {
                return false;
            }
            else {
                reserved.update({[key]: val});
                return true;
            }
        }
    }) as Link;

    tick(id, tag);
    room.links.set(id, [link, obj]);

    return link;
}