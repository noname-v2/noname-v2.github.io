import { freeze, access, split } from './utils';
import type { Extension, HeroData, CardData, SkillData, Select } from './types';

/** Map of loaded extensions. */
const extensions = new Map<string, Extension>();

/** Load extension. */
export async function importExtension(extname: string) {
    if (!extensions.has(extname)) {
        const ext = freeze((await import(`../extensions/${extname}/main.js`)).default);
        extensions.set(extname, ext);
    }
    return extensions.get(extname)!;
}

/** Access extension content. */
export function accessExtension(path: string, ...paths: string[]): any {
    if (paths.length) {
        if (!path.includes(':')) {
            path += ':'
        }
        else {
            path += '.'
        }
        path += paths.join('.');
    }
    const [ext, keys] = path.split(':');
    return access(extensions.get(ext)!, keys) ?? null;
}

/** Get hero info. */
interface GetData { hero: HeroData; card: CardData; skill: SkillData }

export function getData<T extends keyof GetData>(type: T, id: string): GetData[T] {
    const [ext, name] = split(id);
    return accessExtension(ext, type, name);
}

/** Create a filter to check if item is selectable. */
export function createFilter<T extends string | number>(sel: Select<T>, all: T[], selected: T[], task?: any): (item: T) => boolean {
    // check if selected number is OK
    const num = Array.isArray(sel.num) ? sel.num[1] : sel.num;
    if (selected.length >= num) {
        return () => false;
    }

    // get function from extension
    if (!sel.filter) {
        return () => true;
    }
    const func = accessExtension(sel.filter);

    // wrap function with this and task argument
    const filterThis =  { all, selected, getData, accessExtension }
    return (item: T) => func.apply(filterThis, [item, task]);
}
