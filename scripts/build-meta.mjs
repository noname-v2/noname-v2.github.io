import fs from 'fs';
import { rollup } from 'rollup';

import { buildComponents } from './build-components.mjs';
import { buildSheets } from './build-sheets.mjs';

/**
 * Bundle sources into single files.
 */
 async function build(input, output) {
	console.log('building', input);
    
	const bundle = await rollup({
		input: `build/src/${input}.js`,
	});
    
    await bundle.write({
        format: 'iife',
        file: `${output}.js`
    });
}

// update version
const pack = JSON.parse(fs.readFileSync('package.json'));
fs.writeFileSync('build/version.ts', `export const version = '${pack.version}';\nexport const homepage = '${pack.homepage}';`);

// index components and stylesheets for src
buildComponents();
buildSheets();

// run tsc
console.log('running tsc')
