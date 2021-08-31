import { freeze, access, split } from './utils';
import type { Extension } from './types';
import type { lib } from './client/globals';

/** Map of loaded extensions. */
const extensions = new Map<string, Extension>();

/** Load extension. */
export async function importExtension(extname: string, index?: typeof lib) {
    if (!extensions.has(extname)) {
        const ext = freeze((await import(`../extensions/${extname}/main.js`)).default);
        extensions.set(extname, ext);
        if (index) {
            for (const section in ext.lib) {
                Object.assign((index as any)[section], ext.lib[section]);
            }
        }
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
export function getHero(hero: string) {
    const [ext, name] = split(hero);
    return accessExtension(ext, 'hero', name);
}

/** Get card info. */
export function getCard(card: string) {
    const [ext, name] = split(card);
    return accessExtension(ext, 'card', name);
}