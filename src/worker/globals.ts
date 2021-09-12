import { debug } from '../meta';
import type { Room } from './room';
import type { Task } from '../game/task';

export const taskClasses = new Map<string, { new(id: number): Task }>();
export const gameClasses = new Map<string, any>();
export let room: Room;

/** Initial configurations from client. */
export let uid: string;
export let info: [string, string];

export function setRoom(r: Room) {
    room = r;

    if (debug) {
        (self as any).room = r;
    }
}

export function init(u: string, i: [string, string]) {
    uid = u;
    info = i;
}