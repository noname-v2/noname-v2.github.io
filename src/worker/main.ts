import { Room } from './room'
import { set, room } from './globals';
import { dispatch } from './hub';
import { ClientMessage } from './worker';
import { taskClasses } from './classes';
import { taskClasses as tasks} from './globals';

// setup default task classes
for (const [task, cls] of taskClasses) {
    tasks.set(task, cls);
}

self.onmessage = ({data}: {data: ClientMessage}) => {
    if (data[1] === 0) {
        self.onmessage = ({data}: {data: ClientMessage}) => dispatch(data);
        set('room', new Room());
        room.init(data[0], data[3]);
    }
}

(self as any).postMessage('ready');