/** Game tasks. */
import { trigger } from './main/trigger';
import { setup } from './main/setup';
import { loop } from './main/loop';
import { lobby } from './main/lobby';

/** Player tasks. */
import { choose } from './player/choose';

// card tasks
import { moveTo } from './card/move-to';

export const tasks = {
    trigger, setup, loop, lobby,
    choose,
    moveTo
};