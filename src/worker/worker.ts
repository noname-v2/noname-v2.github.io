import { hub2owner } from '../hub/types';
import { split } from '../utils';
import type { Room } from './room';
import type { Link, Dict } from '../types';

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

/** Room that controlls a game. */
export let room: Room;
export function enter(r: Room) {
    room = r;
}

/** Connected hub. */
let connection: WebSocket | null = null;

/** Links of connected clients. */
let peers: Map<string, Link> | null = null;

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
export function broadcast(tick: UITick) {
    if (peers) {
        // broadcast tick
        connection!.send('bcast:' + JSON.stringify(tick));
    }
    (self as any).postMessage(tick);
}

/** Send a message to a client. */
export function send(to: string, tick: UITick) {
    if (to === room.uid) {
        (self as any).postMessage(tick);
    }
    else if (peers) {
        // send tick to a remote client
        connection!.send('to:' + JSON.stringify([
            to, JSON.stringify(tick)
        ]))
    }
}

/** Handler of hub messages. */
const messages = {
    /** The room is ready for clients to join. */
    ready() {
        peers = new Map();
        createPeer(room.uid, room.info);
    },

    /** A remote client joins the room. */
    join(msg: string) {
        // join as player or spectator
        const [uid, info]: [string, [string, string]] = JSON.parse(msg);
        createPeer(uid, info);
        hub.update();
        send(uid, room.pack());
    },

    /** A remote client leaves the room. */
    leave(uid: string) {
        if (peers?.has(uid)) {
            peers.get(uid)!.unlink();
            peers.delete(uid);
            sync();
            hub.update();
        }
    },

    /** A remote client sends a response message. */
    resp(msg: string) {
        dispatch(JSON.parse(msg));
    }
}

/** Hub related operations. */
class Hub {
    get peers() {
        return getPeers();
    }

    get players() {
        return getPeers({playing: true});
    }

    get spectators() {
        return getPeers({playing: false});
    }

    /** Connect to remote hub. */
    connect(url: string) {
        if (connection) {
            return;
        }
        const ws = connection = new WebSocket('wss://' + url);
        ws.onerror = ws.onclose = () => {
            if (connection === ws) {
                connection = null;
                if (peers) {
                    for (const peer of peers.values()) {
                        peer.unlink();
                    }
                }
                peers = null;
                sync();
            }
        };
        ws.onopen = () => {
            ws.send('init:' + JSON.stringify([room.uid, room.info, this.update(false)]));
        };
        ws.onmessage = ({data}) => {
            try {
                const [method, arg] = split<typeof hub2owner[number]>(data);
                messages[method](arg);
            }
            catch (e) {
                console.log(e, data);
            }
        };
    }

    /** Disconnect from remote hub. */
    disconnect() {
        const ws = connection;
        if (ws) {
            ws.send('edit:close');
            setTimeout(() => {
                if (ws === connection) {
                    ws.close();
                }
            }, 1000);
        }
    }

    /** Update room info for idle clients. */
    update(push=true) {
        const state = JSON.stringify([
            // mode name
            room.mode.name,
            // joined players
            this.players!.length ?? 1,
            // number of players in a game
            room.config.np,
            // nickname and avatar of owner
            room.info,
            // game state
            room.progress
        ]);
        if (push) {
            connection?.send('edit:' + state);
        }
        return state;
    }
}

export const hub = new Hub();

/** Tell registered components about client update. */
function sync() {
    let links = null;
    if (peers) {
        links = [];
        for (const peer of peers.values()) {
            links.push(peer.id);
        }
    }
    room.arena.peers.links;
}

/** Get peers that match certain condition. */
function getPeers(filter?: Dict) {
    if (!peers) {
        return null;
    }
    const links = [];
    for (const peer of peers.values()) {
        let skip = false;
        for (const key in filter) {
            if (peer[key] !== filter[key]) {
                skip = true;
                continue;
            }
        }
        if (!skip) {
            links.push(peer);
        }
    }
    return links;
}

/** Create a peer component. */
function createPeer(uid: string, info: [string, string]) {
    const peer = room.create('peer');
    peer.update({
        owner: uid,
        nickname: info[0],
        avatar: info[1],
        playing: getPeers({playing: true})!.length < room.config.np
    });
    peers!.set(uid, peer);
    sync();
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
                const key = stage.awaits.get(id);
                if (key) {
                    stage.results[key] = result;
                }
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
