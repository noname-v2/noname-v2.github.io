import fs from 'fs';
import walk from './walk.mjs';

/**
 * Capatalize a string
 * @param {string} str - String to be capatalized.
 */
 function capatalize(str) {
    return str.length ? str[0].toUpperCase() + str.slice(1) : '';
}

/**
 * Create an index of a set classes.
 */
export function buildClasses(name) {
    const clsName = capatalize(name);
    const imports = [];
    const types = [];
    const tags = [ `export type ${clsName}TagMap = {` ];
    const classes = [ `export const ${name}Classes = new Map<string, typeof ${clsName}>();` ];

    // index files
    for (const src of walk(`src/${name}s`, '.ts')) {
        const cls = src.split('/').pop().split('-').map(capatalize).join('');
        const tag = cls[0].toLowerCase() + cls.slice(1);
        const type = cls + (name === 'link' ? ', ' + cls + 'Data' : '');
        const astype = name === 'link' ? ' as typeof Link' : '';
        imports.push(`import { ${cls} } from '../src/${name}s/${src}';`);
        types.push(`export type { ${type} } from '../src/${name}s/${src}';`);
        classes.push(`${name}Classes.set('${tag}', ${cls}${astype});`);
        tags.push(`    '${tag}': ${cls};`);
    }

    // write class map
    fs.writeFileSync(`build/${name}-classes.ts`,
        imports.join('\n') + '\n\n' +
        classes.join('\n') + '\n\n' +
        tags.join('\n') + `\n    [key: string]: ${clsName};\n};\n`);
    
    // write tag map
    fs.writeFileSync(`build/${name}-types.ts`, types.join('\n'));
}

export function build() {
    buildClasses('component');
    buildClasses('task');
    buildClasses('link');
}
