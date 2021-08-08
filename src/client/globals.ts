import type { Client } from './client';
import type { UI } from './ui';
import type { Database } from './database';
import type { App, Arena, Splash } from '../components';

/** Internal context. */
export const globals = {} as {
    client: Client;
    ui: UI;
    db: Database;
    app: App;
    splash: Splash;
    arena?: Arena;
};

////// debug
(globalThis as any).globals = globals;