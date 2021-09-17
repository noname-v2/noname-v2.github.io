import { debug } from '../meta';
import type { Room } from './room';
import type { Task } from '../tasks/task';
import type { Link, LinkClass } from '../links/link';

export const taskClasses = new Map<string, typeof Task>();
export const linkClasses = new Map<string, typeof Link>();
export let room: Room;

/** Initial configurations from client. */
export let uid: string;
export let info: [string, string];

/** Initialize uid, nickname and avatar. */
export function init(u: string, i: [string, string]) {
    uid = u;
    info = i;
}

/** Set current room. */
export function setRoom(r: Room) {
    room = r;

    if (debug) {
        (self as any).room = r;
    }
}