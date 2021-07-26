/** Plain object. */
export type Dict<T=any> = {[key: string]: T};

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
export function apply<T extends Dict = Dict>(to: T, from: Dict): T {
    for (const key in from) {
        if (to[key]?.constructor === Object && from[key]?.constructor === Object) {
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