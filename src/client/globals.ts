import type { Client } from './client';
import type { UI } from './ui';
import type { Database } from './database';
import type { ComponentClass, App, Arena, Splash } from '../components';
import type { Accessor } from './accessor';

/** Internal context. */
export const globals = { } as {
    client: Client;
    ui: UI;
    db: Database;
    app: App;
    splash: Splash;
    arena?: Arena;
    componentClasses: Map<string, ComponentClass>;
    accessor: Accessor;
};

////// debug
(globalThis as any).globals = globals;