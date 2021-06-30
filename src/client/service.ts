import { Database } from './database';
import { version } from '../version';


/** Database for file storage. */
const db = new Database();

/** Base URL */
const scope = (self as any).registration.scope;

/** Read-only system files. */
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

self.addEventListener('activate', (e: any) => {
    e.waitUntil(
        caches.keys().then(async keys => {
            for (const key of keys) {
                if (key !== version) {
                    await caches.delete(key);
                }
            }
        })
    );
});

self.addEventListener('fetch', (e: any) => {
    let url = <string>e.request.url;

    if (url.startsWith(scope)) {
        url = url.slice(scope.length);
    }
    
    // if (scope.startsWith('http://127.0.0.1')) {
    //     e.respondWith(fetch(e.request));
    // }
    if (src.includes(url)) {
        e.respondWith(caches.match(e.request).then(async response => {
            if (response) {
                return response;
            }

            const fetched = await fetch(e.request);

            if (fetched.ok) {
                const cache = await caches.open(version);
                await cache.put(e.request, fetched.clone());
            }
            
            return fetched;
        }));
    }
    else {
        e.respondWith(db.ready.then(async () => {
            const data = await db.readFile(url);

            if (data) {
                return new Response(data);
            }
            
            const fetched = await fetch(e.request);

            if (fetched.ok) {
                await db.writeFile(url, await fetched.clone().blob());
            }
            
            return fetched;
        }));
    }
});