/** Opened indexedDB object. */
let db: IDBDatabase;

/** Cache of settings. */
const cache = new Map<string, any>();

/** Resolved when indexedDB is open and cached. */
export const ready = new Promise<void>(resolve => {
    // open database
    const request = indexedDB.open('noname_v2', 2);

    // create new database
    request.onupgradeneeded= () => {
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
                cache.set(cursor.key as string, cursor.value);
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
function transact(name: 'settings' | 'files', cmd: 'get' | 'put' | 'delete', key: string, value?: unknown) {
    return new Promise(resolve => {
        const mode = cmd === 'get' ? 'readonly' : 'readwrite';
        const store = db.transaction(name, mode).objectStore(name);
        const request = cmd === 'put' ? store[cmd](value, key) : store[cmd](key);
        request.onsuccess = () => resolve(request.result ?? null);
    });
}

/** Get value of synchronous database entry. */
export function get(key: string): any {
    return cache.get(key) ?? null;
}

/** Set value of synchronous database entry. */
export function set(key: string, value?: unknown) {
    if (value === null || value === undefined) {
        // delete entry
        cache.delete(key);
        transact('settings', 'delete', key);
    }
    else {
        // modify entry
        cache.set(key, value);
        transact('settings', 'put', key, value);
    }
}

/** Get value from asynchronous database. */
export function readFile(key: string): any {
    return transact('files', 'get', key);
}

/** Set value to asynchronous database. */
export function writeFile(key: string, value?: unknown) {
    if (value === null || value === undefined) {
        // delete entry
        return transact('files', 'delete', key);
    }
    else {
        // modify entry
        return transact('files', 'put', key, value);
    }
}

/** List all files. */
export function readdir() {
    const store = db!.transaction('files', 'readonly').objectStore('files');
    const iterator = store.openCursor();
    const files: string[] = [];
    
    return new Promise<string[]>(resolve => {
        iterator.onsuccess = () => {
            const cursor = iterator.result;
            if (cursor) {
                // set cache value and go to next entry
                files.push(cursor.key as string);
                cursor.continue();
            }
            else {
                // cache done
                resolve(files);
            }
        };
    });
}