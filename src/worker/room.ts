import { Stage } from './stage';
import { copy, apply, freeze } from '../utils';
import { Task } from './task';
import { Game } from './game';
import { Link, createLink } from './link';
import { taskClasses } from './globals';
import { importExtension, accessExtension } from '../extension';
import type { UITick } from './worker';
import type { ModeData, Dict } from '../types';

/** Room that controls game flow and classes. */
export class Room {
    /** Owner ID. */
    uid!: string;

    /** Owner nickname and avatar. */
    info!: [string, string];

    /** Root game stage. */
    rootStage!: Stage;

    /** Current game stage. */
    currentStage!: Stage;

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

    /** Links to components. */
    links = new Map<number, [Link, Dict]>();

    /** Map from a task to the stage containing the task. */
    taskMap = new Map<Task, Stage>();

    /** All created stages. */
    #stages = new Map<number, Stage>();

    /** Array of packages that define mode tasks (priority: high -> low). */
    #ruleset: string[] = [];

    /** Map of task classes. */
    #taskClasses = new Map<string, { new(): Task }>();

    /** Base game classes. */
    #gameClasses = new Map<string, any>();

    /** Number of links created. */
    #linkCount = 0;

    /** Number of stages created. */
    #stageCount = 0;

    /** Currently paused by stage.awaits. */
    #paused = true;

    async init(uid: string, [name, packs, info]:  [string, string[], [string, string]]) {
        this.uid = uid;
        this.info = info;

        // initialize classes
        this.#initClasses();

        // load extensions
        await Promise.all(packs.map(pack => importExtension(pack)));

        // Get list of packages that define game classes
        await this.#getRuleset(name);

        // merge mode objects and game classes from extensions
        const mode = await this.#loadRuleset();
        
        // start game
        this.game = new (this.getClass('game'))();
        this.game.mode = mode;
        this.game.packs = new Set(packs);
        this.rootStage = this.currentStage = this.createStage('main');
        this.arena = this.game.create('arena');
        this.arena.ruleset = this.#ruleset;
        this.arena.packs = packs;
        this.arena.mode = mode.extension;
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

    /** Get or create task constructor. */
    getTask(path: string): { new(): Task } {
        if (!this.#taskClasses.has(path)) {
            // get task from extension sections
            const section = accessExtension(path);
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

    /** Get and load all extensions relevant to current mode. */
    async #getRuleset(mode: string) {
        while (mode) {
            if (this.#ruleset.includes(mode)) {
                break;
            }
            this.#ruleset.unshift(mode);
            mode = (await importExtension(mode))!.mode?.inherit as string;
        }
    }

    /** Update extension-defined classes and game mode. */
    async #loadRuleset() {
        const mode: ModeData = {};
        const modeTasks = [];
        const exclude = ['tasks', 'components', 'classes'];

        for (const pack of this.#ruleset) {
            const extMode: ModeData = copy(accessExtension(pack)?.mode ?? {});

            // update game classes (including base Task class)
            for (const name in extMode.classes) {
                const cls = this.#gameClasses.get(name);
                this.#gameClasses.set(name, extMode.classes[name](cls));
            }

            // update task classes after Task class is finalized
            modeTasks.push(extMode.tasks);            
            apply(mode, extMode, exclude);
        }

        // update task classes
        for (const tasks of modeTasks) {
            for (const task in tasks) {
                const cls = this.#taskClasses.get(task) ?? this.getClass('task');
                const constructor = (tasks[task] as any)(cls);
                if (typeof constructor === 'function') {
                    this.#taskClasses.set(task, constructor);
                }
                else {
                    for (const name in constructor) {
                        this.#taskClasses.set(name, constructor[name]);
                    }
                }
            }
        }

        // save mode extension name
        mode.extension = this.#ruleset[this.#ruleset.length - 1];

        return freeze(mode);
    }

    /** Initialize classes. */
    #initClasses() {
        for (const [task, cls] of taskClasses) {
            this.#taskClasses.set(task, cls);
        }

        this.#gameClasses.set('game', Game);
        this.#gameClasses.set('task', Task);
    }
}