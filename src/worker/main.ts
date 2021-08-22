import { Room } from './room'
import { ClientMessage, dispatch, enter } from './worker';

self.onmessage = ({data}: {data: ClientMessage}) => {
    if (data[1] === 0) {
        self.onmessage = ({data}: {data: ClientMessage}) => dispatch(data);
        const room = new Room();
        enter(room);
        room.init(data[0], data[3]);
    }
}
(self as any).postMessage('ready');