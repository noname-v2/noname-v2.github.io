import { rollup } from 'rollup';
import walk from './walk.mjs';

/**
 * Bundle sources into single files.
 */
 async function build(input, output, format='iife') {
	console.log('packing', input);
    
	const bundle = await rollup({
		input: `build/src/${input}.js`,
	});
    
    await bundle.write({format, file: `${output}.js`});
}

// bundle sources
await build('client/main', 'dist/client');
await build('client/service', 'dist/service');
await build('worker/main', 'dist/worker');

// bundle extensions
for (const file of walk('src/extensions', '.ts')) {
    if (file.endsWith('/main')) {
        await build(`extensions/${file}`, `extensions/${file}`, 'esm')
    }
}