import { ready, create } from './ui';
import { backups, restore } from './globals';
import { componentClasses } from '../../build/component-classes';

// initialize component classes
for (const [tag, cls] of componentClasses) {
    backups.set(tag, cls);
}
restore();

// create app component
ready.then(() => {
    create('app');
});