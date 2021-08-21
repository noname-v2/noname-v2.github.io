import { ready, create } from './ui';
import { backups, restore, init } from "./shared";
import { componentClasses } from '../classes';

// initialize component classes
for (const [tag, cls] of componentClasses) {
    backups.set(tag, cls);
}
restore();

// create app component
ready.then(() => {
    init(create);
});