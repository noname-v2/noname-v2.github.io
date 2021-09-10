import { Room } from './room'
import { setRoom, room, init } from './globals';
import { dispatch } from './hub';
import { ClientMessage } from './worker';
import { taskClasses, gameClasses } from './classes';
import { taskClasses as tasks, gameClasses as games} from './globals';

// setup default task and  classes
for (const [task, cls] of gameClasses) {
    games.set(task, cls);
}

for (const [task, cls] of taskClasses) {
    tasks.set(task, cls);
}

self.onmessage = ({data}: {data: ClientMessage}) => {
    if (data[1] === 0) {
        self.onmessage = ({data}: {data: ClientMessage}) => dispatch(data);
        init(data[0], data[3][2]);
        setRoom(new Room());
        room.init(data[3][0], data[3][1]);
    }
}

(self as any).postMessage('ready');