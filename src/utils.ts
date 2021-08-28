import type { Dict } from './types';

/** Deep copy plain object. */
export function copy(from: Dict) {
    const to: Dict = {};
    for (const key in from) {
        if (from[key]?.constructor === Object) {
            to[key] = copy(from[key])
        }
        else if (from[key] !== null && from[key] !== undefined) {
            to[key] = from[key];
        }
    }
    return to;
}

/** Merge two objects. */
export function apply<T extends Dict = Dict>(to: T, from: Dict, exclude?: string[]): T {
    for (const key in from) {
        if (exclude?.includes(key)) {
            continue;
        }
        else if (to[key]?.constructor === Object && from[key]?.constructor === Object) {
            apply(to[key], from[key])
        }
        else if (from[key] !== null && from[key] !== undefined) {
            (to as Dict)[key] = from[key];
        }
    }
    return to;
}

/** Deep freeze object. */
export function freeze(obj: Dict) {
    const propNames = Object.getOwnPropertyNames(obj);
    for (const name of propNames) {
        const value = obj[name];
        if (value && typeof value === 'object') {
            freeze(value);
        }
    }
    return Object.freeze(obj);
}

/** Access key of a nested object. */
export function access(obj: Dict, keys: string) {
    if (keys && obj) {
        for (const key of keys.split('.')) {
            obj = obj[key] ?? null;
            if (obj === null) {
                break;
            }
        }
    }
    return obj ?? null;
}

/** Split string with `:`. */
export function split<T extends string = string>(msg: string, delimiter=':'): [T, string] {
    const idx = msg.indexOf(delimiter);
    if (idx === -1) {
        return [msg as T, ''];
    }
    else {
        return [msg.slice(0, idx) as T, msg.slice(idx + 1)];
    }
}

/** Return a promise that resolves after n seconds. */
export function sleep(n: number) {
    return new Promise(resolve => setTimeout(resolve, n * 1000));
}

/** Generate a unique string based on current Date.now().
 * Mapping: Date.now(): [0-9] -> [0-62] -> [A-Z] | [a-z] | [0-9]
 */
export function rng() {
    return new Date().getTime().toString().split('').map(n => {
        const c = Math.floor((parseInt(n) + Math.random()) * 6.2);
        return String.fromCharCode(c < 26 ? c + 65 : (c < 52 ? c + 71 : c - 4));
    }).join('');
}

/** Fetch and parse json file. */
export function readJSON<T>(...args: string[]) {
    return new Promise<T>(resolve => {
        fetch(args.join('/')).then(response => {
            response.json().then(resolve);
        });
    });
}

/** Randomly get an item from an array. */
export function rget<T>(iterable: Iterable<T>): T {
    const arr = Array.from(iterable);
    return arr[Math.floor(Math.random() * arr.length)];
}

/** Randomly get items from an array. */
export function rgets<T>(iterable: Iterable<T>, n: number = 1, inplace: boolean = false): Set<T> {
    let set;
    if (inplace && iterable instanceof Set) {
        set = iterable;
    }
    else {
        set = new Set(iterable);
    }
    const setChosen = new Set<T>();
    for (let i = 0; i < n; i++) {
        const item = rget(set);
        set.delete(item);
        setChosen.add(item);
    }
    return setChosen;
}