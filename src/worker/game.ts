import { Stage } from './stage';
import { copy, apply, freeze, access, Dict } from '../utils';
import { Task } from './task';
import { Accessor } from './accessor';
import type { Worker, UITick } from './worker';
import type { Extension, Mode } from './extension';

/** A link to client component. */
export interface Link {
    /** Component ID. */
    readonly id: number;

    /** Component tag. */
    readonly tag: string;

    /** Call a component method. */
    readonly call: (method: string, arg?: any) => void;

    /** Update multiple properties. */
    readonly update: (items: Dict) => void;

    /** Remove reference to a component. */
    readonly unlink: () => void;

    [key: string]: any;
}

export class Game {
    /** Root game stage. */
    readonly rootStage!: Stage;

    /** Current game stage. */
    currentStage!: Stage;

    /** Links to components. */
    readonly links = new Map<number, [Link, Dict]>();

    /** Game mode. */
    readonly mode: Mode = {};

    /** Game configuration. */
    readonly config: Dict;

    /** Hero packages. */
    readonly packs: Set<string>;

    /** Banned packages. */
    readonly banned = {
        heropacks: new Set<string>(),
        cardpacks: new Set<string>(),
        heros: new Set<string>(),
        cards: new Set<string>(),
    };

    /** Arena link. */
    readonly arena!: Link;

    /** Game progress.
     * 0: waiting
     * 1: gaming
     * 2: over
    */
    progress = 0;

    /** Currently paused by stage.awaits. */
    paused = true;

    /** Property and method accessor. */
    readonly accessor: Accessor;

    /** Worker reference. */
    #worker: Worker;

    /** All created stages. */
    #stages = new Map<number, Stage>();

    /** Loaded extensions. */
    #extensions = new Map<string, Extension>();

    /** Array of packages that define mode tasks (priority: high -> low). */
    #ruleset: string[] = [];

    /** Map of task classes. */
    #taskClasses = new Map<string, typeof Task>();

    /** Number of links created. */
    #linkCount = 0;

    /** Number of stages created. */
    #stageCount = 0;

    constructor(content: [string, string[], string[], string[], Dict, [string, string]], worker: Worker) {
        this.#worker = worker;
        this.packs = new Set(content[1]);
        this.banned.heropacks = new Set(content[2]);
        this.banned.cardpacks = new Set(content[3]);
        this.config = content[4];
        (this.#worker as any).info = content[5];
        this.accessor = new Accessor(this, worker);

        // load extensions
        const load = async (pack: string) => {
            const ext = freeze((await import(`../extensions/${pack}/main.js`)).default);
            this.#extensions.set(pack, ext);
        };

        Promise.all(content[1].map(load)).then(async () => {
            // index packages that define mode tasks
            let mode = content[0];
            while (mode) {
                if (this.#ruleset.includes(mode)) {
                    break;
                }
                if (!this.#extensions.has(mode)) {
                    await load(mode);
                }
                this.#ruleset.unshift(mode);
                mode = this.#extensions.get(mode)!.mode?.inherit as string;
            }

            // merge mode objects from extensions and create task constructors
            for (const name of this.#ruleset) {
                const mode: Mode = copy(this.#extensions.get(name)?.mode ?? {});
                for (const task in mode.tasks) {
                    const cls = this.#taskClasses.get(task) ?? Task;
                    this.#taskClasses.set(task, mode.tasks[task](cls));
                }
                apply(this.mode, mode);
            }

            // finalize and freez mode object
            delete this.mode.tasks;
            delete this.mode.components;
            this.mode.extension = content[0];
            freeze(this.mode);

            // start game
            (this as any).rootStage = this.currentStage = this.createStage('main');
            (this as any).arena = this.create('arena');
            this.loop();
        });
    }

    /** Create a link. */
    create(tag: string) {
        const id = ++this.#linkCount;
        const obj: Dict = {};

        // reserved link keys
        const reserved: Dict = {
            id, tag,
            call: (method: string, arg?: any) => {
                this.#worker.tick(id, [method, arg]);
            },
            unlink: () => {
                this.#worker.tick(id, null);
                this.links.delete(id);
            },
            update: (items: Dict) => {
                for (const key in items) {
                    const val = items[key] ?? null;
                    val === null ? delete obj[key] : obj[key] = val;
                }
                this.#worker.tick(id, items);
            }
        };

        const link = new Proxy(obj, {
            get(_, key: string) {
                if (key in reserved) {
                    return reserved[key];
                }
                else {
                    return obj[key];
                }
            },
            set(_, key: string, val: any) {
                if (key in reserved) {
                    return false;
                }
                else {
                    reserved.update({[key]: val});
                    return true;
                }
            }
        }) as Link;

        this.links.set(id, [link, obj]);
        this.#worker.tick(id, tag);
        return link;
    }

    /** Create a stage. */
    createStage(path: string, data?: Dict, parent?: Stage) {
        const id = ++this.#stageCount;
        const stage = new Stage(id, path, data ?? {}, parent ?? null, this);
        this.#stages.set(id, stage);
        return stage;
    }

    /** Access extension content. */
    getExtension(path: string): any {
        const [ext, keys] = path.split(':');
        return access(this.#extensions.get(ext)!, keys) ?? null;
    }

    /** Get or create task constructor. */
    getTask(path: string): typeof Task {
        if (!this.#taskClasses.has(path)) {
            // get task from extension sections
            const section = this.getExtension(path);
            const cls = section.inherit ? this.getTask(section.inherit) : Task;
            this.#taskClasses.set(path, section.task!(cls));
        }
        return this.#taskClasses.get(path)!;
    }

    /** Update room info for idle clients. */
    syncRoom(push=true) {
        const room = JSON.stringify([
            // mode name
            this.mode.name,
            // joined players
            this.#worker.getPeers({playing: true})?.length ?? 1,
            // number of players in a game
            this.config.np,
            // nickname and avatar of owner
            this.#worker.info,
            // game state
            this.progress
        ]);
        if (push) {
            this.#worker.connection?.send('edit:' + room);
        }
        return room;
    }

    /** Backup game progress. */
    backup() {
        //////
        return new Promise<void>(resolve => {
            resolve();
        });
    }

    /** Get a UITick of all links. */
    pack(): UITick {
        const tags: Dict<string> = {};
        const props: Dict<Dict> = {};
        for (const [uid, [link, obj]] of this.links.entries()) {
            tags[uid] = link.tag;
            props[uid] = obj;
        }
        return [this.currentStage.id, tags, props, {}];
    }

    /** Mark game as started and disallow changing configuration. */
    start() {
        freeze(this.mode);
        freeze(this.config);
        freeze(this.packs);
        freeze(this.banned);
        this.progress = 1;
        this.syncRoom();
    }

    /** Mark game as over. */
    over() {
        this.progress = 2;
        this.syncRoom();
    }

    /** Execute stages. */
    async loop() {
        if (this.paused) {
            this.paused = false;
            while (this.progress !== 2 && await this.rootStage.next());
            this.paused = true;
        }
    }
}