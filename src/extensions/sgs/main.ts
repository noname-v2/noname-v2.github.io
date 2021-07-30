import type { SGS } from './types';
import { config } from './config';

import { trigger } from './tasks/trigger';
import { loop } from './tasks/loop';
import { setup } from './tasks/setup';
import { lobby } from './tasks/lobby';
import { choose } from './tasks/choose';
import { chooseHero } from './tasks/choose-hero';
import { createPlayers } from './tasks/create-players';

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
            trigger, loop, lobby, setup, choose, chooseHero, createPlayers
        },
        classes: {
            game, task, player, card, skill
        }
    }
} as SGS;