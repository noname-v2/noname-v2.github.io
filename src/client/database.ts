export class Database  {
    /** indexedDB object. */
	private db?: IDBDatabase;

	/** Get, set or delete database entry. */
	private transact(name: 'settings'|'files', cmd: 'get'|'put'|'delete', key: string, value?: unknown) {
		return new Promise(resolve => {
			const mode = cmd === 'get' ? 'readonly' : 'readwrite';
			const store = (<IDBDatabase>this.db).transaction(name, mode).objectStore(name);
			const request = cmd === 'put' ? store[cmd](value, key) : store[cmd](key);
			request.onsuccess = () => resolve(request.result ?? null);
		});
	}

	/** Cache for synthronous database. */
	private cache = new Map<string, unknown>();

	/** Resolved when ready. */
	ready: Promise<void>;

	constructor() {
		// open database
		const request = indexedDB.open('noname_v2', 2);
		const timeout = setTimeout(() => window.location.reload(), 3000); // workaround for Safari indexedDB problem

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
		this.ready = new Promise<void>(resolve => {
			request.onsuccess = () => {
				clearTimeout(timeout);
				
				// save database
				this.db = request.result;

				// cache synchronous database
				const store = this.db.transaction('settings', 'readonly').objectStore('settings');
				const iterator = store.openCursor();
				
				// iterate through database and save to this.cache
				iterator.onsuccess = () => {
					const cursor = iterator.result;
					if (cursor) {
						// set cache value and go to next entry
						this.cache.set(<string>cursor.key, cursor.value);
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
	get(key: string): any {
		return this.cache.get(key) ?? null;
	}

	/** Set value of synchronous database entry. */
	set(key: string, value?: unknown) {
		if (value === null || value === undefined) {
			// delete entry
			this.cache.delete(key);
			this.transact('settings', 'delete', key);
		}
		else {
			// modify entry
			this.cache.set(key, value);
			this.transact('settings', 'put', key, value);
		}
	}

	/** Get value from asynchronous database. */
	readFile(key: string): any {
		return this.transact('files', 'get', key);
	}

	/** Set value to asynchronous database. */
	writeFile(key: string, value?: unknown) {
		if (value === null || value === undefined) {
			// delete entry
			return this.transact('files', 'delete', key);
		}
		else {
			// modify entry
			return this.transact('files', 'put', key, value);
		}
	}

	/** List all files. */
	readdir() {
		const store = this.db!.transaction('files', 'readonly').objectStore('files');
		const iterator = store.openCursor();
		const files: string[] = [];
		
		return new Promise<string[]>(resolve => {
			iterator.onsuccess = () => {
				const cursor = iterator.result;
				if (cursor) {
					// set cache value and go to next entry
					files.push(<string>cursor.key);
					cursor.continue();
				}
				else {
					// cache done
					resolve(files);
				}
			};
		});
	}
}