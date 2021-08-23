import type { Room } from './room';
import type { Hub } from './hub';
import type { Link } from './link';

export let room: Room;
export let hub: Hub;
export let connection: WebSocket | null = null;
export let peers: Map<string, Link> | null = null;

export function set(name: string, val: any) {
    switch (name) {
        case 'room': room = val; break;
        case 'hub': hub = val; break;
        case 'connection': connection = val; break;
        case 'peers': peers = val; break;
    }
}