import type { Client } from './client';
import type { UI } from './ui';
import type { Database } from './database';
import type { ComponentClass, App, Arena, Splash } from '../components';
import { platform } from './platform';

/** Internal context. */
export const globals = { platform } as {
    client: Client;
    ui: UI;
    db: Database;
    app: App;
    splash: Splash;
    arena?: Arena;
    componentClasses: Map<string, ComponentClass>;
    platform: typeof platform;
};

////// debug
(globalThis as any).globals = globals;