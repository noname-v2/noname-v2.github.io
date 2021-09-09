import { freeze, access, split } from './utils';
import type { Extension, HeroData, CardData, SkillData, Select, Selected, FilterThis } from './types';

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
export function createFilter(
    section: string,
    sel: Select,
    allSelected: Selected,
    allItems: Selected,
    task?: any): (item: unknown) => boolean {
    // check if more items can be selected
    const selected = allSelected[section];
    const items = allItems[section];
    const max = Array.isArray(sel.num) ? sel.num[1] : sel.num;

    // get function from extension
    if (!sel.filter) {
        return () => selected.length < max;
    }
    const func = accessExtension(sel.filter);

    // wrap function with this and task argument
    const filterThis: FilterThis =  { selected, items, allSelected, allItems, getData, accessExtension }
    return (item: unknown) => {
        if (selected.length >= max) {
            return false;
        }
        return func.apply(filterThis, [item, task]);
    };
}
