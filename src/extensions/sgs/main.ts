import type { SGS } from './sgs';
import { config } from './config';
import { trigger } from './tasks/trigger';
import { loop } from './tasks/loop';
import { lobby } from './tasks/lobby';
import { chooseHero } from './tasks/choose-hero';
import { createPlayers } from './tasks/create-players';

export default {
    mode: {
        np: 0,
        config,
        tasks: {
            trigger, loop, lobby, chooseHero, createPlayers
        }
    }
} as SGS;