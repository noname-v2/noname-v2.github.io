import { freeze, access, split } from './utils';
import type { Extension, HeroData, CardData, SkillData, Select, Selected, FilterThis, Dict } from './types';

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
interface GetInfo { hero: HeroData; card: CardData; skill: SkillData }

export function getInfo<T extends keyof GetInfo>(type: T, id: string): GetInfo[T] {
    const [ext, name] = split(id);
    return accessExtension(ext, type, name);
}

/** Create a filter to check if item is selectable. */
export function createFilter(
    section: string,
    selected: Selected,
    selects: Dict<Select>,
    getData: (id: number) => { readonly [key: string]: any },
    task?: any): (item: unknown) => boolean {
    // check if more items can be selected
    const sel = selects[section];
    const max = Array.isArray(sel.num) ? sel.num[1] : sel.num;

    // get function from extension
    if (!sel.filter) {
        return () => selected[section].length < max;
    }
    const func = accessExtension(sel.filter);

    // wrap function with this and task argument
    const filterThis = {
        selected, selects,
        getInfo, getData, accessExtension
    } as FilterThis;

    for (const key in sel) {
        filterThis[key] = sel[key];
    }

    return (item: unknown) => {
        if (selected[section].length >= max) {
            return false;
        }
        return func.apply(filterThis, [item, task]);
    };
}
