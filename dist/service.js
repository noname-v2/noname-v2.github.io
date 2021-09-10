(function () {
    'use strict';

    /** Opened indexedDB object. */
    let db;
    /** Cache of settings. */
    const cache = new Map();
    /** Resolved when indexedDB is open and cached. */
    const ready = new Promise(resolve => {
        // open database
        const request = indexedDB.open('noname_v2', 2);
        // create new database
        request.onupgradeneeded = () => {
            // synchronous
            if (!request.result.objectStoreNames.contains('settings')) {
                request.result.createObjectStore('settings');
            }
            // asynchronous
            if (!request.result.objectStoreNames.contains('files')) {
                request.result.createObjectStore('files');
            }
        };
        // wait until database is ready
        request.onsuccess = () => {
            // save database reference
            db = request.result;
            // cache synchronous database
            const store = db.transaction('settings', 'readonly').objectStore('settings');
            const iterator = store.openCursor();
            // iterate through database and save to this.cache
            iterator.onsuccess = () => {
                const cursor = iterator.result;
                if (cursor) {
                    // set cache value and go to next entry
                    cache.set(cursor.key, cursor.value);
                    cursor.continue();
                }
                else {
                    // cache done
                    resolve();
                }
            };
        };
    });
    /** Get, set or delete a database entry. */
    function transact(name, cmd, key, value) {
        return new Promise(resolve => {
            const mode = cmd === 'get' ? 'readonly' : 'readwrite';
            const store = db.transaction(name, mode).objectStore(name);
            const request = cmd === 'put' ? store[cmd](value, key) : store[cmd](key);
            request.onsuccess = () => resolve(request.result ?? null);
        });
    }
    /** Get value from asynchronous database. */
    function readFile(key) {
        return transact('files', 'get', key);
    }
    /** Set value to asynchronous database. */
    function writeFile(key, value) {
        if (value === null || value === undefined) {
            // delete entry
            return transact('files', 'delete', key);
        }
        else {
            // modify entry
            return transact('files', 'put', key, value);
        }
    }

    const version = '2.0.0dev1';

    /** Base URL */
    const scope = self.registration.scope;
    /** Essential files to be saved to cache. */
    const src = [
        '',
        'index.css',
        'index.html',
        'dist/client.js',
        'dist/worker.js',
        'app.webmanifest'
    ];
    self.addEventListener('install', (e) => {
        e.waitUntil(caches.open(version).then(cache => {
            return cache.addAll(src);
        }));
    });
    /** Remove cached files from older versions. */
    self.addEventListener('activate', (e) => {
        e.waitUntil(caches.keys().then(async (keys) => {
            for (const key of keys) {
                if (key !== version) {
                    await caches.delete(key);
                }
            }
        }));
    });
    self.addEventListener('fetch', (e) => {
        // access remote content directly without saving
        if (!e.request.url.startsWith(scope)) {
            e.respondWith(fetch(e.request));
            return;
        }
        // relative path as IDB key
        const url = e.request.url.slice(scope.length);
        if (src.includes(url)) {
            // retrieve file from cache
            e.respondWith(caches.match(e.request).then(async (response) => {
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
            e.respondWith(ready.then(async () => {
                try {
                    const data = await readFile(url);
                    if (data) {
                        return new Response(data);
                    }
                }
                catch { }
                let fetched = await fetch(e.request);
                // attempt to fetch from extension URL if local file is not found
                if (!fetched.ok && url.startsWith('extension/')) {
                    try {
                        const redirect = await readFile('redirect');
                        const path = url.split('/');
                        const extension = path[1];
                        if (redirect instanceof Map && redirect.has(extension)) {
                            path[0] = redirect.get(extension);
                            fetched = await fetch(new Request(path.join('/')));
                        }
                    }
                    catch { }
                }
                // save to indexedDB
                if (fetched.ok) {
                    fetched.clone().blob().then(blob => {
                        writeFile(url, blob);
                    });
                }
                return fetched;
            }));
        }
    });

}());
