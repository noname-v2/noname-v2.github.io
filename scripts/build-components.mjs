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
 * Create an index of component or elementclasses.
 * @param {'component'|'element'} target - Component or element.
 */
export function buildComponents() {
    const imports = [
        `import type { ComponentClass } from '../src/client/component'`
    ];

    const types = [
        `export type { Point, Region, MoveState, TransitionDuration } from '../src/client/ui'`,
        `export { Component } from '../src/client/component'`
    ];

    const insertions = [
        'export const componentClasses = new Map<string, ComponentClass>()'
    ];

    for (const src of walk('src/components', '.ts')) {
        // CamelCase class name
        const cls = src.split('/').map(capatalize).join('');
        const tag = src.split('/').join('-');
        imports.push(`import { ${cls} } from '../src/components/${src}'`)
        types.push(`export type { ${cls} } from '../src/components/${src}'`)
        insertions.push(`componentClasses.set('${tag}', ${cls})`);
    }

    // write to file
    fs.writeFileSync('build/classes.ts', imports.join(';\n') + ';\n\n' + insertions.join(';\n') + ';');
    fs.writeFileSync('build/components.ts', types.join(';\n') + ';');
}