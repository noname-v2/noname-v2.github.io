import { ready, create } from './ui';
import { backups, restore, init } from "./shared";
import { componentClasses } from '../classes';

// initialize component classes
for (const [key, val] of componentClasses) {
    backups.set(key, val);
}
restore();

// create app component
ready.then(() => {
    init(create);
});