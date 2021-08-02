import { Stage } from './stage';
import { copy, apply, freeze, access } from '../utils';
import { Task } from './task';
import { Accessor } from './accessor';
import { importExtension } from '../extension';
import type { Worker, UITick } from './worker';
import type { Extension, Mode, Link, Dict } from '../types';


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

    /** Property and method accessor. */
    readonly accessor!: Accessor;

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

    /** Base game classes. */
    #gameClasses = new Map<string, any>([['game', Accessor], ['task', Task]]);

    /** Number of links created. */
    #linkCount = 0;

    /** Number of stages created. */
    #stageCount = 0;

    /** Currently paused by stage.awaits. */
    #paused = true;

    constructor(content: [string, string[], string[], string[], Dict, [string, string]], worker: Worker) {
        this.#worker = worker;
        this.packs = new Set(content[1]);
        this.banned.heropacks = new Set(content[2]);
        this.banned.cardpacks = new Set(content[3]);
        this.config = content[4];
        (this.#worker as any).info = content[5];

        // load extensions
        Promise.all(content[1].map(mode => importExtension(mode))).then(() => this.#loadMode(content[0]));
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

    /** Get a game class. */
    getClass(path: string) {
        return this.#gameClasses.get(path);
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
        if (this.#paused) {
            this.#paused = false;
            while (this.progress !== 2 && await this.rootStage.next());
            this.#paused = true;
        }
    }

    /** Load mode. */
    async #loadMode(mode: string) {
        // Get list of packages that define game classes
        let pack = mode;
        while (pack) {
            if (this.#ruleset.includes(pack)) {
                break;
            }
            this.#ruleset.unshift(pack);
            pack = (await importExtension(pack))!.mode?.inherit as string;
        }

        // merge mode objects and game classes from extensions
        const modeTasks = [];
        for (const pack of this.#ruleset) {
            const mode: Mode = copy(this.#extensions.get(pack)?.mode ?? {});
            for (const name in mode.classes) {
                const cls = this.#gameClasses.get(name);
                this.#gameClasses.set(name, mode.classes[name](cls));
            }
            modeTasks.push(mode.tasks);            
            apply(this.mode, mode);
        }

        // update task classes
        for (const tasks of modeTasks) {
            for (const task in tasks) {
                const cls = this.#taskClasses.get(task) ?? this.getClass('task');
                this.#taskClasses.set(task, (tasks[task] as any)(cls));
            }
        }

        // finalize and freez mode object
        delete this.mode.game;
        delete this.mode.tasks;
        delete this.mode.components;
        this.mode.extension = mode;
        freeze(this.mode);
        
        // start game
        (this as any).accessor = new (this.getClass('game'))(this, this.#worker);
        (this as any).rootStage = this.currentStage = this.createStage('main');
        const arena = (this as any).arena = this.create('arena');
        arena.ruleset = this.#ruleset;
        this.loop();
    }
}