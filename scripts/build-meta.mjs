import fs from 'fs';

import { buildClasses } from './build-classes.mjs';
import { buildSheets } from './build-sheets.mjs';

// get info from package.json
const pack = JSON.parse(fs.readFileSync('package.json'));
fs.writeFileSync('build/version.ts',
    `export const version = '${pack.version}';\n` +
    `export const homepage = '${pack.homepage};'`);

// index components and stylesheets for src
buildClasses();
buildSheets();