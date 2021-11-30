import { hub2owner } from '../hub/types';
import { split } from '../utils';
import { room, uid, info } from './globals';
import type { UITick, ClientMessage } from './worker';
import type { Link, Peer, PeerData } from '../links/link';

/** WebSocket connection. */
export let connection: WebSocket | null = null;

/** IDs and links of connected clients. */
export let peers: Map<string, Peer> | null = null;

/** Handler of messages received. */
const messages = {
    /** The room is ready for clients to join. */
    ready() {
        peers = new Map();
        createPeer(uid, info);
    },

    /** A remote client joins the room. */
    join(msg: string) {
        // join as player or spectator
        const [uid, info]: [string, [string, string]] = JSON.parse(msg);
        createPeer(uid, info);
        update();
        send(uid, room.pack());
    },

    /** A remote client leaves the room. */
    leave(uid: string) {
        if (peers?.has(uid)) {
            peers.get(uid)!.unlink();
            peers.delete(uid);
            sync();
            update();
        }
    },

    /** A remote client sends a response message. */
    resp(msg: string) {
        dispatch(JSON.parse(msg));
    }
}

/** Connect to remote hub. */
export function connect(url: string) {
    if (connection) {
        return;
    }
    const ws = connection = new WebSocket('wss://' + url);

    // connection closed
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

    // send room info to hub
    ws.onopen = () => {
        ws.send('init:' + JSON.stringify([ uid, info, update(false) ]));
    };

    // handle messages
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

/** Push peer changes to clients. */
function sync() {
    let ids = null;
    if (peers) {
        ids = [];
        for (const peer of peers.values()) {
            ids.push(peer.id);
        }
    }
    room.arena.data.peers = ids;
}

/** Disconnect from remote hub. */
export function disconnect() {
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

/** Send a message to a client. */
export function send(to: string, tick: UITick) {
    if (to === uid) {
        (self as any).postMessage(tick);
    }
    else if (peers) {
        // send tick to a remote client
        connection!.send('to:' + JSON.stringify([
            to, JSON.stringify(tick)
        ]))
    }
}

/** Update room info for idle clients. */
export function update(push=true) {
    const state = JSON.stringify([
        // mode name
        room.arena.mode.name,
        // joined players
        getPeers({playing: true})?.length ?? 1,
        // number of players in a game
        room.arena.config.np,
        // nickname and avatar of owner
        info,
        // game state
        room.progress
    ]);
    if (push) {
        connection?.send('edit:' + state);
    }
    return state;
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
            disconnect();
        }
        else if (sid === stage.id && link && link.owner === uid) {
            // send result to listener
            if (done && stage.awaits.has(id)) {
                // results: component.respond() -> link.await()
                link.respond(result);
            }
            else if (!done && stage.monitors.has(id)) {
                // results: component.yield() -> link.monitor()
                const method = stage.monitors.get(id)!;
                (stage.task as any)[method](result, link);
            }
        }
    }
    catch (e) {
        console.log(e);
    }
}

/** Create a peer component. */
function createPeer(uid: string, info: [string, string]) {
    const peer = room.create('peer');
    peer.update({
        owner: uid,
        nickname: info[0],
        avatar: info[1],
        playing: getPeers({playing: true})!.length < room.arena.config.np
    });
    peers!.set(uid, peer);
    sync();
}

/** Get peers that match certain condition. */
export function getPeers(filter?: Partial<PeerData>) {
    if (!peers) {
        return null;
    }
    const links = [];
    for (const peer of peers.values()) {
        let skip = false;
        let key: keyof PeerData;
        for (key in filter) {
            if (peer.data[key] !== (filter as PeerData)[key]) {
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
