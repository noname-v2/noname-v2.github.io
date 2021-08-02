import type { SGS } from './types';
import { config } from './config';

// game tasks
import { trigger } from './tasks/trigger';
import { setup } from './tasks/setup';
import { loop } from './tasks/loop';
import { lobby } from './tasks/lobby';

// base game classes
import { game } from './core/game';
import { task } from './core/task';
import { skill } from './core/skill';
import { player } from './core/player';
import { card } from './core/card';

// player tasks
import { choose } from './player/choose';
import { chooseHero } from './player/choose-hero';

// card tasks
import { moveTo } from './card/move-to';

// client-side component classes
import { arena } from './components/arena';

export default {
    mode: {
        np: 0,
        config,
        tasks: {
            trigger, setup, loop, lobby,
            choose, chooseHero,
            moveTo
        },
        classes: {
            game, task, player, card, skill
        },
        components: {
            arena   
        }
    }
} as SGS;