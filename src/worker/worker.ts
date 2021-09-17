import { room } from './globals';
import { apply } from '../utils';
import * as hub from './hub';
import type { Dict } from '../types';

/** An update to client side. */
export type UITick = [
    /** Stage ID. */
    number,

    /** Add or delete components. */
    Dict<string | null>,

    /** Component property updates. */
    Dict<Dict>,

    /** Component function calls. */
    Dict<[string, any[]][]>
];

/** One section of a UITick. */
type TickItem = string | null | Dict | [string, any];

/** Stage ID, component ID and UITick section. */
type TickEntry = [number, number, TickItem];

/** Client-side message.
 * 0: uid
 * 1: stage ID
 * 2: component ID
 * 3: component return value (from yield() or respond())
 * 4: component return type (true: result from respond(), false: result from yield())
 */
export type ClientMessage = [string, number, number, any, boolean];

/** Ticked history items with timestamp. */
const history: [number, UITick][] = [];

/** Entries to be ticked. */
const ticks: TickEntry[] = [];

/** Send a message to all clients. */
function broadcast(tick: UITick) {
    if (hub.peers) {
        hub.connection!.send('bcast:' + JSON.stringify(tick));
    }
    (self as any).postMessage(tick);
}

/** Add component update (called by Link). */
export function tick(id: number, item: TickItem) {
    if (ticks.length === 0) {
        // schedule a UITick if no pending UITick exists
        setTimeout(() => commit());
    }
    ticks.push([room.currentStage?.id ?? 0, id, item]);
}

/** Generate UITick(s) from this.#ticks. */
function commit() {
    // split UITick by stage change
    const stages: [number, TickEntry[]][] = [];
    const now = Date.now();
    for (const entry of ticks) {
        if (stages.length === 0 || stages[stages.length - 1][0] !== entry[0]) {
            stages.push([entry[0], []]);
        }
        stages[stages.length - 1][1].push(entry);
    }

    // generate UITick(s)
    for (const [stageID, entries] of stages) {
        const tagChanges: Dict<string | null> = {};
        const propChanges: Dict<Dict> = {};
        const calls: Dict<[string, any[]][]> = {};

        // merge updates from different ticks
        for (const [, id, item] of entries) {
            if (Array.isArray(item)) {
                calls[id] ??= [];
                calls[id].push(item);
            }
            else if (item && typeof item === 'object') {
                propChanges[id] ??= {};
                const props = propChanges[id];

                for (const key in item) {
                    if (key.startsWith('^')) {
                        const key2 = key.slice(1);

                        if (props[key2]?.constructor === Object) {
                            // merge patch with existing full update
                            apply(props[key2], item[key]);
                        }
                        else {
                            // merge patch with existing patch
                            delete props[key2];
                            props[key] ??= {};
                            apply(props[key], item[key]);
                        }
                    }
                    else {
                        // replace patch with full update
                        delete props['^' + key];
                        props[key] = item[key];
                    }
                }
            }
            else {
                tagChanges[id] = item;
            }
        }

        // sync and save UITick
        const tick: UITick = [stageID, tagChanges, propChanges, calls];
        broadcast(tick);
        history.push([now, tick]);
    }

    ticks.length = 0;
}