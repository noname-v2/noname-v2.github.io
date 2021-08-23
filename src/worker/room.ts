import { Stage } from './stage';
import { copy, apply, freeze, access } from '../utils';
import { Task } from './task';
import { Game } from './game';
import { Link, createLink } from './link';
import { importExtension, getExtension } from '../extension';
import type { UITick } from './worker';
import type { Mode, Dict } from '../types';

/** Room that controlls game flow and classes. */
export class Room {
    /** Owner ID. */
    uid!: string;

    /** Owner nickname and avatar. */
    info!: [string, string];

    /** Root game stage. */
    rootStage!: Stage;

    /** Current game stage. */
    currentStage!: Stage;

    /** Game mode. */
    mode: Mode = {};

    /** Game configuration. */
    config!: Dict;

    /** Hero packages. */
    packs!: Set<string>;

    /** Link to Arena. */
    arena!: Link;

    /** Game object. */
    game!: Game;

    /** Game progress.
     * 0: waiting
     * 1: gaming
     * 2: over
    */
    progress = 0;

    /** Map from a task to the stage containing the task. */
    tasks = new Map<Task, Stage>();

    /** Links to components. */
    links = new Map<number, [Link, Dict]>();

    /** All created stages. */
    #stages = new Map<number, Stage>();

    /** Array of packages that define mode tasks (priority: high -> low). */
    #ruleset: string[] = [];

    /** Map of task classes. */
    #taskClasses = new Map<string, typeof Task>();

    /** Base game classes. */
    #gameClasses = new Map<string, any>([['game', Game], ['task', Task]]);

    /** Number of links created. */
    #linkCount = 0;

    /** Number of stages created. */
    #stageCount = 0;

    /** Currently paused by stage.awaits. */
    #paused = true;

    async init(uid: string, [mode, packs, config, info]:  [string, string[], Dict, [string, string]]) {
        this.uid = uid;
        this.info = info;
        this.packs = new Set(packs);
        this.config = config;

        // load extensions
        await Promise.all(packs.map(pack => importExtension(pack)));

        // Get list of packages that define game classes
        await this.#getRuleset(mode);

        // merge mode objects and game classes from extensions
        await this.#getClasses();

        // finalize and freez mode object
        delete this.mode.tasks;
        delete this.mode.components;
        delete this.mode.classes;
        this.mode.extension = mode;
        freeze(this.mode);
        
        // start game
        this.game = new (this.getClass('game'))();
        this.rootStage = this.currentStage = this.createStage('main');
        this.arena = this.create('arena');
        this.arena.ruleset = this.#ruleset;
        this.loop();
    }

    /** Create a link. */
    create(tag: string) {
        const id = ++this.#linkCount;
        return createLink(id, tag);
    }

    /** Create a stage. */
    createStage(path: string, data?: Dict, parent?: Stage) {
        const id = ++this.#stageCount;
        const stage = new Stage(id, path, data ?? {}, parent ?? null);
        this.#stages.set(id, stage);
        return stage;
    }

    /** Access extension content. */
    getExtension(path: string): any {
        const [ext, keys] = path.split(':');
        return access(getExtension(ext)!, keys) ?? null;
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

    /** Get a UITick of all links. */
    pack(): UITick {
        const tags: Dict<string> = {};
        const props: Dict<Dict> = {};
        for (const [uid, [link, obj]] of this.links) {
            tags[uid] = link.tag;
            props[uid] = obj;
        }
        return [this.currentStage.id, tags, props, {}];
    }

    /** Execute stages. */
    async loop() {
        if (this.#paused) {
            this.#paused = false;
            while (this.progress !== 2 && await this.rootStage.next());
            this.#paused = true;
        }
    }

    async #getRuleset(mode: string) {
        while (mode) {
            if (this.#ruleset.includes(mode)) {
                break;
            }
            this.#ruleset.unshift(mode);
            mode = (await importExtension(mode))!.mode?.inherit as string;
        }
    }

    async #getClasses() {
        const modeTasks = [];
        for (const pack of this.#ruleset) {
            const mode: Mode = copy(getExtension(pack)?.mode ?? {});

            // update game classes (including base Task class)
            for (const name in mode.classes) {
                const cls = this.#gameClasses.get(name);
                this.#gameClasses.set(name, mode.classes[name](cls));
            }

            // update task classes after Task class is finalized
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
    }
}