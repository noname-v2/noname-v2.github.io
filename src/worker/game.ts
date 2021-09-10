import { room, uid } from './globals';
import * as hub from './hub';
import * as utils from '../utils';
import { accessExtension, getInfo, createFilter } from '../extension';
import type { Link } from './link';
import type { Task } from './task';
import type { ModeData, Dict, Select, Selected, PileEntries, Extension } from '../types';

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

/** Game object used by stages. */
export abstract class Game {
    /** Game mode. */
    mode!: ModeData;

    /** Game configuration. */
    config: Dict = {};

    /** Hero packages. */
    packs!: Set<string>;

    /** Hub accessor. */
    #hub = new Hub();

    [key: string]: any;

    get owner() {
        return uid;
    }

    get arena() {
        return room.arena;
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

    get getInfo() {
        return getInfo;
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

    createFilter(section: string, selected: Selected, sels: Dict<Select>, task: Task) {
        return createFilter(section, selected, sels, (id: number) => new Proxy(this.get(id)!, {
            get(target, key: string) {
                return target[key];
            }
        }), task);
    }

    /** Get a link. */
    get(id: number): Link {
        return room.links.get(id)![0];
    }

    /** Create a link. */
    create(tag: string) {
        return room.create(tag);
    }

    /** Creata a class in game.#gameClasses. */
    createInstance(name: string, ...args: any[]) {
        return new (room.getClass(name))(...args);
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
    abstract backup(): void;

    /** Restore game state. */
    abstract restore(): void;
}