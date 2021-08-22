import { ready, create } from './ui';
import { backups, restore, set } from './globals';
import { componentClasses } from '../classes';

// initialize component classes
for (const [tag, cls] of componentClasses) {
    backups.set(tag, cls);
}
restore();

// create app component
ready.then(() => {
    set('app', create('app'));
});