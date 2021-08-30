import { freeze, access, split } from './utils';
import type { Extension } from './types';

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
export function getHero(hero: string) {
    const [ext, name] = split(hero);
    return accessExtension(ext, 'hero', name);
}

/** Get card info. */
export function getCard(card: string) {
    const [ext, name] = split(card);
    return accessExtension(ext, 'card', name);
}