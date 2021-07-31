import type { SGS } from './types';
import { config } from './config';

// task classes
import { trigger } from './tasks/trigger';
import { setup } from './tasks/setup';
import { loop } from './tasks/loop';
import { lobby } from './tasks/lobby';
import { choose } from './tasks/choose';
import { chooseHero } from './tasks/choose-hero';

// game classes
import { game } from './core/game';
import { task } from './core/task';
import { player } from './core/player';
import { card } from './core/card';
import { skill } from './core/skill';

export default {
    mode: {
        np: 0,
        config,
        tasks: {
            trigger, setup, loop, lobby, choose, chooseHero
        },
        classes: {
            game, task, player, card, skill
        }
    }
} as SGS;