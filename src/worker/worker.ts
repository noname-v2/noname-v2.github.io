import { connection, room, hub } from './globals';
import type { Dict } from '../types';

/** An update to client side. */
export type UITick = [
    // stage ID
    number,
    // add or delete components
    Dict<string | null>,
    // component property updates
    Dict<Dict>,
    // component function calls
    Dict<[string, any][]>
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

/** Send a message to a client. */
export function send(to: string, tick: UITick) {
    if (to === room.uid) {
        (self as any).postMessage(tick);
    }
    else if (hub.connected) {
        // send tick to a remote client
        connection!.send('to:' + JSON.stringify([
            to, JSON.stringify(tick)
        ]))
    }
}

/** Send a message to all clients. */
function broadcast(tick: UITick) {
    if (hub.connected) {
        connection!.send('bcast:' + JSON.stringify(tick));
    }
    (self as any).postMessage(tick);
}

/** Add component update (called by Link). */
export function tick(id: number, item: TickItem) {
    if (ticks.length === 0) {
        // schedule a UITick if no pending UITick exists
        setTimeout(() => commit());
    }
    ticks.push([room.currentStage.id, id, item]);
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
        const calls: Dict<[string, any][]> = {};

        // merge updates from different ticks
        for (const [, id, item] of entries) {
            if (Array.isArray(item)) {
                calls[id] ??= [];
                calls[id].push(item);
            }
            else if (item && typeof item === 'object') {
                propChanges[id] ??= {};
                Object.assign(propChanges[id], item);
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

/** Dispatch message from client. */
export async function dispatch(data: ClientMessage) {
    try {
        const [uid, sid, id, result, done] = data;
        const stage = room.currentStage;
        const link = room.links.get(id);
        if (id === -1) {
            // reload UI upon error
            send(uid, room.pack());
        }
        else if (id === -2) {
            // disconnect from remote hub
            hub.disconnect();
        }
        else if (sid === stage.id && link && link[1].owner === uid) {
            // send result to listener
            if (done && stage.awaits.has(id)) {
                // results: component.respond() -> link.await()
                stage.results.set(id, result);
                stage.awaits.delete(id);
                if (!stage.awaits.size) {
                    room.loop();
                }
            }
            else if (!done && stage.monitors.has(id)) {
                // results: component.yield() -> link.monitor()
                const method = stage.monitors.get(id)!;
                (stage.task as any)[method](result, link[0]);
            }
        }
    }
    catch (e) {
        console.log(e);
    }
}
