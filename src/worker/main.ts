import { Room } from './room'
import { Hub } from './hub';
import { ClientMessage, globals, dispatch } from './worker';

globals.room = new Room();
globals.hub = new Hub();

self.onmessage = ({data}: {data: ClientMessage}) => {
    if (data[1] === 0) {
        self.onmessage = ({data}: {data: ClientMessage}) => dispatch(data);
        globals.room.init(data[0], data[3]);
    }
}

(self as any).postMessage('ready');