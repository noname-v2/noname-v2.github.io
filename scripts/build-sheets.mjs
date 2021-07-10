import fs from 'fs';
import sass from 'sass';
import walk from './walk.mjs';


export function buildSheets() {
    const imports = [];

    for (const file of walk('src/sheets')) {
        const entry = `@import 'src/sheets/${file}';`

        if (file === 'mixin') {
            imports.unshift(entry);
        }
        else {
            imports.push(entry);
        }
    }

    // compile to css
    fs.writeFileSync('build/index.scss', imports.join('\n'), 'utf-8');
    fs.writeFileSync('dist/index.css',
        sass.renderSync({file: 'build/index.scss'}).css.toString(),
    'utf-8');
}