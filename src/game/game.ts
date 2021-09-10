import { room, uid } from '../worker/globals';
import * as hub from '../worker/hub';
import * as utils from '../utils';
import { accessExtension, getInfo, createFilter } from '../extension';
import type { Link } from '../worker/link';
import type { Task } from './task';
import type { Player } from './player';
import type { Card } from './card';
import type { Skill } from './skill';
import type { Minion } from './minion';
import type { Linked } from './linked';
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

    /** Get a link. */
    get(id: number): Link {
        return room.links.get(id)![0];
    }

    /** Create a link. */
    create(tag: string) {
        return room.create(tag);
    }

    /** Creata a class in game.#gameClasses. */
    createLinked<T extends Linked = Linked>(type: string): T {
        const linked = new (room.getClass(type))(this, type);
        const map = (this as any)[type + 's'];
        if (map instanceof Map) {
            map.set(linked.id, linked);
        }
        return linked;
    }

    /** Create a new player. */
    createPlayer() {
        return this.createLinked<Player>('player');
    }

    /** Create a new card. */
    createCard() {
        return this.createLinked<Card>('card');
    }

    /** Create a new skill. */
    createSkill() {
        return this.createLinked<Skill>('skill');
    }

    /** Create a new card. */
    createMinion() {
        return this.createLinked<Minion>('minion');
    }

    /** Create a filter that determines if an item can be selected. */
    createFilter(section: string, selected: Selected, sels: Dict<Select>, task: Task) {
        return createFilter(section, selected, sels, (id: number) => new Proxy(this.get(id)!, {
            get(target, key: string) {
                return target[key];
            }
        }), task);
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