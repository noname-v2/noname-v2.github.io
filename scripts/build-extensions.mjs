import fs from 'fs';
import walk from './walk.mjs';


export function buildExtensions() {
    for (const file of walk('src/extensions', '.ts')) {
        fs.copyFileSync(`build/src/extensions/${file}.js`, `extensions/${file}.js`)
    }
}
