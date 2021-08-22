import { Room } from './room'
import { Hub } from './hub';
import { set } from './globals';
import { ClientMessage, dispatch } from './worker';

self.onmessage = ({data}: {data: ClientMessage}) => {
    if (data[1] === 0) {
        self.onmessage = ({data}: {data: ClientMessage}) => dispatch(data);
        const room = new Room();
        set('room', room);
        set('hub', new Hub());
        room.init(data[0], data[3]);
    }
}

(self as any).postMessage('ready');