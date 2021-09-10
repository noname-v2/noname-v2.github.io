import { hub2owner } from '../hub/types';
import { split } from '../utils';
import { dispatch, send } from './worker';
import { room, set } from './globals';
import type { Link } from './link';

interface Peer extends Link {
    owner: string;
    nickname: string;
    avatar: string;
    playing: boolean;
    [key: string]: any;
}

/** WebSocket connection. */
export let connection: WebSocket | null = null;

/** IDs and links of connected clients. */
export let peers: Map<string, Peer> | null = null;

/** Get peers that match certain condition. */
export function getPeers(filter?: Partial<Peer>) {
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

/** Handler of messages received. */
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
        ws.send('init:' + JSON.stringify([
            room.uid, room.info, update(false)
        ]));
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
    room.arena.peers = ids;
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

/** Update room info for idle clients. */
export function update(push=true) {
    const state = JSON.stringify([
        // mode name
        room.game.mode.name,
        // joined players
        getPeers({playing: true})?.length ?? 1,
        // number of players in a game
        room.game.config.np,
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

/** Create a peer component. */
function createPeer(uid: string, info: [string, string]) {
    const peer = room.create('peer') as Peer;
    peer.update({
        owner: uid,
        nickname: info[0],
        avatar: info[1],
        playing: getPeers({playing: true})!.length < room.game.config.np
    });
    peers!.set(uid, peer);
    sync();
}
