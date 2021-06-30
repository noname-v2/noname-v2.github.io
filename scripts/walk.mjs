import fs from 'fs';
import path from 'path';

/**
 * Get the structure of a directory.
 * @param {string} dir - Target directory.
 * @param {string} [ext] - Include only the files with a specific extension.
 * @return {string[]} - List of all files in the directory.
 */
export default function walk(dir, ext) {
    // list of files under target directory
    const files = [];

    // get child entries
    for (const entry of fs.readdirSync(dir)) {
        // skip non-source files
        if (!/[A-Z]|[a-z]/.test(entry[0])) {
            continue;
        }

        if (fs.statSync(`${dir}/${entry}`).isFile()) {
            // file entry
            if (!ext || path.extname(entry) == ext) {
                files.push(path.parse(entry).name)
            }
        }
        else {
            // walk into child directory
            for (const file of walk(path.join(dir, entry))) {
                files.push(`${entry}/${file}`);
            }
        }
    }

    return files;
}
