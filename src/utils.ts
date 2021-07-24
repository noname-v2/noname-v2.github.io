/** Deep assign object. */
export function apply(from: {[key: string]: any}, to: {[key: string]: any}) {
    for (const key in from) {
        if (from[key] === null) {
            delete to[key];
        }
        else if (typeof from[key] === 'object' && typeof to[key] === 'object' && to[key]) {
            apply(from[key], to[key]);
        }
        else {
            to[key] = from[key];
        }
    }
    return to;
}

/** Deep freeze object. */
export function freeze(obj: any) {
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
export function access(obj: any, keys: string) {
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