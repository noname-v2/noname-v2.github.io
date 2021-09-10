/** Game tasks. */
import { trigger } from './main/trigger';
import { setup } from './main/setup';
import { loop } from './main/loop';

/** Player tasks. */
import { choose } from './player/choose';

// card tasks
import { moveTo } from './card/move-to';

export const tasks = {
    trigger, setup, loop,
    choose,
    moveTo
};