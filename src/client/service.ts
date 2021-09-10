import * as db from './db';
import { version } from '../meta';

/** Base URL */
const scope = (self as any).registration.scope;

/** Essential files to be saved to cache. */
const src = [
    '',
    'index.css',
    'index.html',
    'dist/client.js',
    'dist/worker.js',
    'app.webmanifest'
];

self.addEventListener('install', (e: any) => {
    e.waitUntil(caches.open(version).then(cache => {
        return cache.addAll(src);
    }));
});

/** Remove cached files from older versions. */
self.addEventListener('activate', (e: any) => {
    e.waitUntil(caches.keys().then(async keys => {
        for (const key of keys) {
            if (key !== version) {
                await caches.delete(key);
            }
        }
    }));
});

self.addEventListener('fetch', (e: any) => {
    // access remote content directly without saving
    if (!e.request.url.startsWith(scope)) {
        e.respondWith(fetch(e.request));
        return;
    }

    // relative path as IDB key
    const url: string = e.request.url.slice(scope.length);

    if (src.includes(url)) {
        // retrieve file from cache
        e.respondWith(caches.match(e.request).then(async response => {
            if (response) {
                return response;
            }

            // save to cache
            const fetched = await fetch(e.request);
            if (fetched.ok) {
                const clone = fetched.clone();
                caches.open(version).then(cache => {
                    cache.put(e.request, clone);
                });
            }
            return fetched;
        }));
    }
    else {
        // retrieve file from indexedDB
        e.respondWith(db.ready.then(async () => {
            try {
                const data = await db.readFile(url);
                if (data) {
                    return new Response(data);
                }
            }
            catch {}
            
            let fetched = await fetch(e.request);

            // attempt to fetch from extension URL if local file is not found
            if (!fetched.ok && url.startsWith('extension/')) {
                try {
                    const redirect = await db.readFile('redirect');
                    const path = url.split('/');
                    const extension = path[1];

                    if (redirect instanceof Map && redirect.has(extension)) {
                        path[0] = redirect.get(extension);
                        fetched = await fetch(new Request(path.join('/')));
                    }
                }
                catch {}
            }

            // save to indexedDB
            if (fetched.ok) {
                fetched.clone().blob().then(blob => {
                    db.writeFile(url, blob);
                });
            }
            return fetched;
        }));
    }
});