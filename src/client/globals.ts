import type { Client } from './client';
import type { UI } from './ui';
import type { Database } from './database';

/** Internal context. */
export const globals = {} as {
    client: Client;
    ui: UI;
    db: Database;
};


////// debug
(globalThis as any).globals = globals;