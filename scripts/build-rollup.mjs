import { rollup } from 'rollup';
import walk from './walk.mjs';

/**
 * Bundle sources into single files.
 */
 async function bundle(input, output, format='iife') {
	console.log('packing', input);
    
	const bundle = await rollup({
		input: `build/src/${input}.js`,
	});
    
    await bundle.write({format, file: `${output}.js`});
}

// bundle sources
await bundle('client/main', 'dist/client');
await bundle('client/service', 'dist/service');
await bundle('worker/main', 'dist/worker');

// bundle extensions
for (const file of walk('src/extensions', '.ts')) {
    if (file.endsWith('/main')) {
        await bundle(`extensions/${file}`, `extensions/${file}`, 'esm')
    }
}