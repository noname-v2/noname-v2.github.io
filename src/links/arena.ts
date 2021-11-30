import { room, uid } from '../worker/globals';
import * as hub from '../worker/hub';
import * as utils from '../utils';
import { accessExtension } from '../extension';
import { Link, LinkData } from './link';
import type { Player } from './player';
import type { Card } from './card';
import type { Skill } from './skill';
import type { Minion } from './minion';
import type { ModeInfo, PileEntries, Extension, Task } from '../types';
import type { LinkTagMap } from '../../build/link-classes';

/** Accessor of hub properties. */
class Hub {
    get peers() {
        return hub.getPeers();
    }

    get players() {
        return hub.getPeers({playing: true});
    }

    get spectators() {
        return hub.getPeers({playing: false});
    }
}

/** Arena data. */
export interface ArenaData extends LinkData {
    /** Connected clients. */
    peers: number[] | null;

    /** Available extensions. */
    packs: string[];
}

/** Content that can be banned. */
export interface ArenaBanned {
    hero?: string[];
    card?: string[];
    heropack?: string[];
    cardpack?: string[];
}

/** Default arena configuration entries. */
export interface ArenaConfig {
    /** Number of players. */
    np: number;

    /** Online mode. */
    online: boolean;

    /** Banned heros / cards / packs. */
    banned: ArenaBanned;

    [key: string]: any;
}

/** Game object used by stages. */
export class Arena extends Link<ArenaData> {
    /** Game mode. */
    mode!: ModeInfo;

    /** Game configuration. */
    config = {} as ArenaConfig;

    /** Created players. */
    players = new Map<number, Player>();

    /** Created cards. */
    cards = new Map<number, Card>();

    /** Created skills. */
    skills = new Map<number, Skill>();

    /** Created minions. */
    minions = new Map<number, Minion>();

    /** Hub accessor. */
    #hub = new Hub();

    get owner() {
        return uid;
    }

    get hub() {
        return this.#hub;
    }

    get connected() {
        return hub.peers ? true : false;
    }

    get utils() {
        return utils;
    }

    get accessExtension() {
        return accessExtension;
    }

    get packs(): string[] {
        return this.data.packs;
    }

    /** Available hero packs. */
    get heropacks(): string[] {
        const packs = [];

        for (const pack of this.packs) {
            if (this.config.banned.heropack?.includes(pack)) {
                continue;
            }

            if (this.accessExtension(pack, 'heropack')) {
                packs.push(pack);
            }
        }

        return packs;
    }

    /** Available card packs. */
    get cardpacks(): string[] {
        const packs = [];

        for (const pack of this.packs) {
            if (this.config.banned.cardpack?.includes(pack)) {
                continue;
            }

            if (this.accessExtension(pack, 'cardpack')) {
                packs.push(pack);
            }
        }

        return packs;
    }

    /** Get a list of all heros. */
    get heros() {
        const heros = new Set<string>();

        for (const pack of this.heropacks) {
            const ext = this.accessExtension(pack) as Extension;
            for (const name in ext?.hero) {
                const id = pack + ':' + name;
                if (this.config.banned?.hero?.includes(id)) {
                    continue;
                }
                heros.add(id);
            }
        }
        
        return heros;
    }

    /** Get card pile entries. */
    get pile() {
        const pile: PileEntries = [];

        for (const pack of this.cardpacks) {
            const ext = this.accessExtension(pack) as Extension;
            for (const name in ext?.pile) {
                for (const suit in ext?.pile[name]) {
                    for (let entry of ext?.pile[name][suit]) {
                        if (typeof entry === 'number') {
                            entry = [entry];
                        }
                        pile.push([name, suit, ...entry]);
                    }
                }
            }
        }
        
        return pile;
    }

    /** Get a link by ID. */
    getLink(id: number): Link {
        return room.links.get(id)!;
    }

    /** Get a task by ID. */
    getTask(id: number): Task {
        return room.stages.get(id)!.task!;
    }

    /** Get a player by ID. */
    getPlayer(id: number): Player {
        return this.players.get(id)!;
    }

    /** Call a task method. */
    callTask([id, method]: [number, string], ...args: any[]): any {
        return (this.getTask(id) as any)[method](...args);
    }

    /** Get the number of arguments of a task method. */
    countArgs([id, method]: [number, string]): number {
        return (this.getTask(id) as any)[method].length;
    }

    /** Create a link. */
    create<T extends keyof LinkTagMap>(tag: T): LinkTagMap[T] {
        return room.create(tag);
    }

    /** Mark game as started and disallow changing configuration. */
    start() {
        utils.freeze(this.config);
        room.progress = 1;
        hub.update();
    }

    /** Mark game as over. */
    over() {
        room.progress = 2;
        hub.update();
    }

    /** Backup game state. */
    backup() {};

    /** Restore game state. */
    restore() {};
}