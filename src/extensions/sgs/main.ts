import { card } from './ruleset/card';
import { player } from './ruleset/player';
import { stage } from './ruleset/stage';
import { game } from './ruleset/game';
import { config } from './ruleset/config';
import type { SGS } from './sgs';

export default <SGS>{
    ruleset: { card, player, stage, game, config }
}