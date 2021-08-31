import fs from 'fs';

import { buildClasses } from './build-classes.mjs';
import { buildSheets } from './build-sheets.mjs';

// get info from package.json
const pack = JSON.parse(fs.readFileSync('package.json'));
fs.writeFileSync('build/meta.ts',
    `export const version = '${pack.version}';\n` +
    `export const homepage = '${pack.homepage}';\n` + 
    `export const hub = ${JSON.stringify(pack.config, null, 4)};\n`);

// get color literal types
const css = JSON.parse(fs.readFileSync('assets/theme/default/theme.json'));
const names = {
    bcolor: 'ButtonColor',
    fill: 'FillColor',
    text: 'TextColor',
    glow: 'GlowColor'
}
let literals = '';
for (const name in names) {
    const vals = Object.keys(css[name]).map(val => `'${val}'`);
    literals += `export type ${names[name]} = ${vals.join(' | ')};\n`;
}
fs.writeFileSync('build/literals.ts', literals);

// copy libraries
fs.copyFileSync('node_modules/eruda/eruda.js', 'lib/eruda.js');

// index components and stylesheets for src
buildClasses();
buildSheets();