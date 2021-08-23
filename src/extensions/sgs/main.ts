import type { SGS } from './types';
import { config } from './config';
import { tasks } from './tasks';
import { classes } from './classes';
import { components } from './components';

export default {
    mode: {
        config,
        tasks,
        classes,
        components
    }
} as SGS;