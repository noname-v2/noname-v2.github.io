import { Room } from './room'
import { Hub } from './hub';
import { set, room } from './globals';
import { ClientMessage, dispatch } from './worker';

self.onmessage = ({data}: {data: ClientMessage}) => {
    if (data[1] === 0) {
        self.onmessage = ({data}: {data: ClientMessage}) => dispatch(data);
        set('hub', new Hub());
        set('room', new Room());
        room.init(data[0], data[3]);
    }
}

(self as any).postMessage('ready');