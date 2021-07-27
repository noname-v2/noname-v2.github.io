import type { Stage } from './stage';
import type { Game, Link } from './game';
import type { Dict } from '../utils';

export class Task {
    /** Game stage that task belongs to. */
    #stage: Stage;

    /** Accessor of game objects. */
    #game: Game;

    /** Leave annotation for subclass. */
    [key: string]: any;

    get game() {
        return this.#game.accessor;
    }

    get path() {
        return this.#stage.path;
    }

    get parent(): Task | null {
        return this.#stage.parent?.task ?? null;
    }

    get results() {
        return this.#stage.results;
    }
    
    constructor(stage: Stage, game: Game) {
        this.#stage = stage;
        this.#game = game;
    }

    /** Main function. */
    main(): void | Promise<void> {}

    /** Create a link. */
    create(tag: string) {
        return this.#game.create(tag);
    }

    /** Add a step in current stage. */
    add(step: string, ...args: any[]) {
        this.#stage.steps.push([step, false, args]);
    }

    /** Add a child stage in current stage. */
    addTask(path: string, data?: Dict) {
        const stage = this.#game.createStage(path, data);
        stage.parent = this.#stage;
        this.#stage.steps.push(stage);
        return stage.task;
    }

    /** Add a sibline stage next to current stage. */
    addSiblingTask(path: string, data?: Dict) {
        const stage = this.#game.createStage(path, data);
        stage.parent = this.#stage.parent!;
        const idx = this.#stage.steps.indexOf(this.#stage.parent!);
        if (idx !== -1) {
            this.#stage.steps.splice(idx + 1, 0, stage);
            return stage.task;
        }
        throw('failed to add sibling to ' + path);
    }

    /** Add a callback for component function call. */
    monitor(link: Link, callback: string) {
        this.#stage.monitors.set(link.id, callback);
    }

    /** Pause step 2 until a return value is received. */
    await(link: Link, tag?: string) {
        this.#stage.awaits.set(link.id, tag ?? null);
    }

    /** Skip stage (may trigger skip event). */
    skip() {
        if (this.#stage.progress < 2) {
            this.#stage.skipped = true;
            this.#stage.awaits.clear();
            this.#stage.monitors.clear();
            return true;
        }
        return false;
    }

    /** Force stage to finish (without triggering skip event). */
    cancel() {
        this.#stage.progress = -1;
        this.#stage.awaits.clear();
        this.#stage.monitors.clear();
    }

    /** Trigger an event. Reserved names:
     * before: triggered before executing task.main()
     * after: triggered after executing task.main()
     * skip: triggered after skipping task.main()
     */
    trigger(name: string) {
        if (name === 'before' || name === 'after' || name === 'skip') {
            throw('reserved event name: ' + name);
        }
        return this.#stage.trigger(name);
    }
}