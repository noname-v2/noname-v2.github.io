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
 * Create an index of component classes.
 */
export function buildComponents() {
    const imports = [
        `import { Component } from '../src/client/component';`
    ];

    const types = [];

    const classes = [
        'export const componentClasses = new Map<string, typeof Component>();',
        `componentClasses.set('component', Component);`
    ];

    const tags = [
        'export type ComponentTagMap = {'
    ];

    for (const src of walk('src/components', '.ts')) {
        // CamelCase class name
        const tag = src.split('/').pop();
        const cls = tag.split('-').map(capatalize).join('');
        imports.push(`import { ${cls} } from '../src/components/${src}';`)
        types.push(`export type { ${cls} } from '../src/components/${src}';`)
        classes.push(`componentClasses.set('${tag}', ${cls});`);
        tags.push(`    '${tag}': ${cls};`);
    }

    // write to file
    fs.writeFileSync('build/classes.ts',
        imports.join('\n') + '\n\n' +
        classes.join('\n') + '\n\n' +
        tags.join('\n') + '\n    [key: string]: Component;\n};\n');
    fs.writeFileSync('build/components.ts', types.join('\n'));
}

/**
 * Create an index of task classes.
 */
 export function buildTasks() {
    const imports = [];

    const classes = [
        'export const gameClasses = new Map<string, any>();',
        'export const taskClasses = new Map<string, { new(): Task }>();\n'
    ];

    const types = [];

    for (const src of walk('src/game', '.ts')) {
        // CamelCase class name
        const tag = src.split('/').pop();
        const cls = tag.split('-').map(capatalize).join('');
        imports.push(`import { ${cls} } from '../src/game/${src}';`);
        types.push(`export * from '../src/game/${src}';`)
        classes.push(`gameClasses.set('${tag}', ${cls});`);
    }

    for (const src of walk('src/tasks', '.ts')) {
        // CamelCase class name
        const tag = src.split('/').pop();
        const cls = tag.split('-').map(capatalize).join('');
        imports.push(`import { ${cls} } from '../src/tasks/${src}';`)
        classes.push(`taskClasses.set('${tag}', ${cls});`);
    }

    // write to file
    fs.writeFileSync('build/tasks.ts', imports.join('\n') + '\n\n' + classes.join('\n'));
    fs.writeFileSync('build/game.ts', types.join('\n'));
}