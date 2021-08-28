import { room } from './globals';
import { tick } from './worker';
import type { Dict } from '../types';

/** A link to client component. */
export interface Link {
    /** Component owner. */
    owner?: string;
    
    /** Component ID. */
    readonly id: number;

    /** Component tag. */
    readonly tag: string;

    /** Return value from component.respond(). */
    readonly result: any;

    /** Call a component method. */
    readonly call: (method: string, arg?: any) => void;

    /** Update multiple properties. */
    readonly update: (items: Dict) => void;

    /** Remove reference to a component. */
    readonly unlink: () => void;

    /** Monitor values from component.yield(). */
    readonly monitor: (callback: string) => void;

    /** Pause current until receiving value from component.respond(). */
    readonly await: () => void;

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
        },
        monitor(callback: string) {
            room.currentStage.monitors.set(link.id, callback);
        },
        await() {
            room.currentStage.awaits.add(link.id);
        },
        result() {
            return room.currentStage.results.get(link.id);
        }
    };

    const link = new Proxy(obj, {
        get(_, key: string) {
            if (key in reserved) {
                if (key === 'result') {
                    return reserved[key]();
                }
                else {
                    return reserved[key];
                }
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