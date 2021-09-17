import { Link, LinkData } from './link';
import type { ArenaConfig } from './arena';
import type { Config, Dict } from '../types';

export interface LobbyData extends LinkData {
    /** Current of players. */
    np: number;

    /** Maximum number of players. */
    npmax: number;

    /** Sidebar entreis. */
    pane: {
        configs: Dict<Config>;
        heropacks: string[];
        cardpacks: string[];
    }

    /** Game coniguration. */
    config: ArenaConfig;
}

export class Lobby extends Link<LobbyData> {

}