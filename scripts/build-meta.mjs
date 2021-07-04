import fs from 'fs';

import { buildComponents } from './build-components.mjs';
import { buildSheets } from './build-sheets.mjs';

// update version
const pack = JSON.parse(fs.readFileSync('package.json'));
fs.writeFileSync('build/version.ts', `export const version = '${pack.version}';\nexport const homepage = '${pack.homepage}';`);

// index components and stylesheets for src
buildComponents();
buildSheets();