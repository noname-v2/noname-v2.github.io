(function () {
    'use strict';

    class Database {
        /** indexedDB object. */
        #db;
        /** Cache for synthronous database. */
        #cache = new Map();
        /** Resolved when ready. */
        #ready;
        get ready() {
            return this.#ready;
        }
        constructor() {
            // open database
            const request = indexedDB.open('noname_v2', 2);
            const timeout = setTimeout(() => window.location.reload(), 3000); // workaround for Safari indexedDB problem
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
            this.#ready = new Promise(resolve => {
                request.onsuccess = () => {
                    clearTimeout(timeout);
                    // save database
                    this.#db = request.result;
                    // cache synchronous database
                    const store = this.#db.transaction('settings', 'readonly').objectStore('settings');
                    const iterator = store.openCursor();
                    // iterate through database and save to this.cache
                    iterator.onsuccess = () => {
                        const cursor = iterator.result;
                        if (cursor) {
                            // set cache value and go to next entry
                            this.#cache.set(cursor.key, cursor.value);
                            cursor.continue();
                        }
                        else {
                            // cache done
                            resolve();
                        }
                    };
                };
            });
        }
        /** Get value of synchronous database entry. */
        get(key) {
            return this.#cache.get(key) ?? null;
        }
        /** Set value of synchronous database entry. */
        set(key, value) {
            if (value === null || value === undefined) {
                // delete entry
                this.#cache.delete(key);
                this.#transact('settings', 'delete', key);
            }
            else {
                // modify entry
                this.#cache.set(key, value);
                this.#transact('settings', 'put', key, value);
            }
        }
        /** Get value from asynchronous database. */
        readFile(key) {
            return this.#transact('files', 'get', key);
        }
        /** Set value to asynchronous database. */
        writeFile(key, value) {
            if (value === null || value === undefined) {
                // delete entry
                return this.#transact('files', 'delete', key);
            }
            else {
                // modify entry
                return this.#transact('files', 'put', key, value);
            }
        }
        /** List all files. */
        readdir() {
            const store = this.#db.transaction('files', 'readonly').objectStore('files');
            const iterator = store.openCursor();
            const files = [];
            return new Promise(resolve => {
                iterator.onsuccess = () => {
                    const cursor = iterator.result;
                    if (cursor) {
                        // set cache value and go to next entry
                        files.push(cursor.key);
                        cursor.continue();
                    }
                    else {
                        // cache done
                        resolve(files);
                    }
                };
            });
        }
        /** Get, set or delete database entry. */
        #transact(name, cmd, key, value) {
            return new Promise(resolve => {
                const mode = cmd === 'get' ? 'readonly' : 'readwrite';
                const store = this.#db.transaction(name, mode).objectStore(name);
                const request = cmd === 'put' ? store[cmd](value, key) : store[cmd](key);
                request.onsuccess = () => resolve(request.result ?? null);
            });
        }
    }

    const version = '2.0.0dev1';

    /** Database for file storage. */
    const db = new Database();
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
            e.respondWith(db.ready.then(async () => {
                const data = await db.readFile(url);
                if (data) {
                    return new Response(data);
                }
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
                    catch { }
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

}());
