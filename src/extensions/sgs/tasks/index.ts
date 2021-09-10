/** Game tasks. */
import { trigger } from './trigger';
import { setup } from './setup';
import { loop } from './loop';

/** Player tasks. */
import { choose } from './player/choose';

// card tasks
import { moveTo } from './card/move-to';

export const tasks = {
    trigger, setup, loop,
    choose,
    moveTo
};