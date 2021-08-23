import type { Room } from './room';
import type { Hub } from './hub';

export let room: Room;
export let hub: Hub;
export let connection: WebSocket | null = null;

export function set(target: 'room' | 'hub' | 'connection', val: any) {
    switch (target) {
        case 'room': room = val; break;
        case 'hub': hub = val; break;
        case 'connection': connection = val; break;
    }

    //////
    if (target === 'room') (self as any).room = val;
}