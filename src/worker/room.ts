import { Stage } from './stage';
import { copy, apply, freeze } from '../utils';
import { Link } from '../links/link';
import { taskClasses, linkClasses } from './globals';
import { importExtension, accessExtension } from '../extension';
import type { Arena } from '../links/arena';
import type { Task } from '../tasks/task';
import type { UITick } from './worker';
import type { ModeInfo, Dict } from '../types';
import type { LinkTagMap } from '../../build/link-classes';

/** Room that controls game flow and classes. */
export class Room {
    /** Root game stage. */
    rootStage!: Stage;

    /** Current game stage. */
    currentStage!: Stage;

    /** Link to Arena. */
    arena!: Arena;

    /** Game progress.
     * 0: waiting
     * 1: gaming
     * 2: over
    */
    progress = 0;

    /** Links to components. */
    links = new Map<number, Link>();

    /** All created stages. */
    stages = new Map<number, Stage>();

    /** Array of packages that define mode tasks (priority: high -> low). */
    #ruleset: string[] = [];

    /** Map of task classes. */
    #taskClasses!: Map<string, typeof Task>;

    /** Base game classes. */
    #linkClasses!: Map<string, any>;

    /** Number of links created. */
    #linkCount = 0;

    /** Number of stages created. */
    #stageCount = 0;

    /** Currently paused by stage.awaits. */
    #paused = true;

    async init(name: string, packs: string[]) {
        // initialize classes
        this.#linkClasses = new Map(linkClasses);
        this.#taskClasses = new Map(taskClasses);

        // load extensions
        await Promise.all(packs.map(pack => importExtension(pack)));

        // Get list of packages that define game classes
        await this.#getRuleset(name);

        // merge mode objects and game classes from extensions
        const mode = await this.#loadRuleset();
        
        // start game
        this.arena = this.create('arena');
        this.arena.mode = mode;
        this.arena.update({ packs, ruleset: this.#ruleset, mode: mode.extension });
        this.rootStage = this.currentStage = this.createStage('main');
        this.loop();
    }

    /** Create a link. */
    create<T extends keyof LinkTagMap>(tag: T): LinkTagMap[T] {
        const id = ++this.#linkCount;
        const cls = this.#linkClasses.get(tag as string) ?? Link;
        return new cls(id, tag);
    }

    /** Create a stage. */
    createStage(path: string, data?: Dict, parent?: Stage) {
        const id = ++this.#stageCount;
        const stage = new Stage(id, path, data ?? {}, parent ?? null);
        this.stages.set(id, stage);
        return stage;
    }

    /** Get or create task constructor. */
    getTask(path: string): typeof Task {
        if (!this.#taskClasses.has(path)) {
            // get task from extension sections
            const section = accessExtension(path);
            const cls = section.inherit ? this.getTask(section.inherit) : this.#linkClasses.get('task');
            this.#taskClasses.set(path, section.task!(cls));
        }
        return this.#taskClasses.get(path)!;
    }

    /** Get a UITick of all links. */
    pack(): UITick {
        const tags: Dict<string> = {};
        const props: Dict<Dict> = {};
        for (const [uid, link] of this.links) {
            tags[uid] = link.tag;
            props[uid] = link.pack();
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
        const mode: ModeInfo = {};
        const modeTasks = [];
        const exclude = ['tasks', 'components', 'classes'];

        for (const pack of this.#ruleset) {
            const extMode: ModeInfo = copy(accessExtension(pack)?.mode ?? {});

            // update game classes (including base Task class)
            for (const name in extMode.classes) {
                const cls = this.#linkClasses.get(name);
                this.#linkClasses.set(name, extMode.classes[name](cls));
            }

            // update task classes after Task class is finalized
            modeTasks.push(extMode.tasks);            
            apply(mode, extMode, exclude);
        }

        // update task classes
        for (const tasks of modeTasks) {
            for (const task in tasks) {
                const cls = this.#taskClasses.get(task) ?? this.#taskClasses.get('task');
                this.#taskClasses.set(task, (tasks[task] as any)(cls));
            }
        }

        // save mode extension name
        mode.extension = this.#ruleset[this.#ruleset.length - 1];

        return freeze(mode);
    }
}