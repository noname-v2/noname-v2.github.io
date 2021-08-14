import type { Client } from './client';
import type { UI } from './ui';
import type { App, Arena, Splash } from '../components';
import * as db from './db';

/** Internal context. */
export const globals = { db } as {
    client: Client;
    ui: UI;
    db: typeof db;
    app: App;
    splash: Splash;
    arena?: Arena;
};

////// debug
(globalThis as any).globals = globals;