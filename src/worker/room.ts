import { Stage } from './stage';
import { copy, apply, freeze } from '../utils';
import { Link, createLink } from './link';
import { taskClasses, gameClasses } from './globals';
import { importExtension, accessExtension } from '../extension';
import type { Task } from '../game/task';
import type { Game } from '../game/game';
import type { UITick } from './worker';
import type { ModeData, Dict } from '../types';

/** Room that controls game flow and classes. */
export class Room {
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

    /** All created stages. */
    stages = new Map<number, Stage>();

    /** Array of packages that define mode tasks (priority: high -> low). */
    #ruleset: string[] = [];

    /** Map of task classes. */
    #taskClasses!: Map<string, { new(id: number): Task }>;

    /** Base game classes. */
    #gameClasses!: Map<string, any>;

    /** Number of links created. */
    #linkCount = 0;

    /** Number of stages created. */
    #stageCount = 0;

    /** Currently paused by stage.awaits. */
    #paused = true;

    async init(name: string, packs: string[]) {
        // initialize classes
        this.#gameClasses = new Map(gameClasses);
        this.#taskClasses = new Map(taskClasses);

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
        this.stages.set(id, stage);
        return stage;
    }

    /** Get or create task constructor. */
    getTask(path: string): { new(id: number): Task } {
        if (!this.#taskClasses.has(path)) {
            // get task from extension sections
            const section = accessExtension(path);
            const cls = section.inherit ? this.getTask(section.inherit) : this.#gameClasses.get('task');
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
}