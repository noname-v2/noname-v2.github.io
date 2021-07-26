import type { Stage } from './stage';
import type { Game } from './game';
import type { Link } from './link';
import type { Accessor } from './accessor';
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
    
    constructor(stage: Stage, game: Game) {
        this.#stage = stage;
        this.#game = game;
        stage.steps.set(this, []);
    }

    /** Main function. */
    main(): void | Promise<void> {}

    /** Create a link. */
    create(tag: string) {
        return this.#game.create(tag);
    }

    /** Add a step in current stage. */
    add(step: string, ...args: any[]) {
        this.#stage.steps.get(this)!.push([step, false, args]);
    }

    /** Add a child stage in current stage. */
    addTask(path: string, ...args: any[]) {
        const stage = this.#game.createStage(path, args);
        stage.parent = this.#stage;
        this.#stage.steps.get(this)!.push(stage);
        return stage.tasks[1];
    }

    /** Add a sibline stage next to current stage. */
    addSiblingTask(path: string, data?: Dict) {
        const stage = this.#game.createStage(path, data);
        stage.parent = this.#stage.parent!;
        for (const steps of this.#stage.parent!.steps.values()) {
            const idx = steps.indexOf(this.#stage.parent!);
            if (idx !== -1) {
                steps.splice(idx + 1, 0, stage);
                return stage.tasks[1];
            }
        }
        throw('failed to add sibling ' + path);
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
            this.#stage.progress = 4;
            this.#stage.skipped = true;
            this.#stage.awaits.clear();
            this.#stage.monitors.clear();
            return true;
        }
        return false;
    }

    /** Force stage to finish (without triggering skip event). */
    cancel() {
        if (this.#stage.progress < 2) {
            this.#stage.progress = -1;
            this.#stage.skipped = true;
            this.#stage.awaits.clear();
            this.#stage.monitors.clear();
            return true;
        }
        return false;
    }
}