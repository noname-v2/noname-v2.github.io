import { hub, room } from './globals';
import { accessExtension, getInfo, createFilter } from '../extension';
import * as utils from '../utils';
import type { Link } from './link';
import type { ModeData, Dict } from '../types';

/** Game object used by stages. */
export abstract class Game {
    /** Game mode. */
    mode!: ModeData;

    /** Game configuration. */
    config: Dict = {};

    /** Hero packages. */
    packs!: Set<string>;

    [key: string]: any;

    get owner() {
        return room.uid;
    }

    get arena() {
        return room.arena;
    }

    get hub() {
        return hub;
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

    get createFilter() {
        return createFilter;
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