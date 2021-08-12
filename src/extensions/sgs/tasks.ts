/** Game tasks. */
import { trigger } from './tasks/trigger';
import { setup } from './tasks/setup';
import { loop } from './tasks/loop';
import { lobby } from './tasks/lobby';

/** Player tasks. */
import { choose } from './player/choose';
import { chooseHero } from './player/choose-hero';

// card tasks
import { moveTo } from './card/move-to';

export const tasks = {
    trigger, setup, loop, lobby,
    choose, chooseHero,
    moveTo
};