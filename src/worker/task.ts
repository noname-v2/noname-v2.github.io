import { room } from './globals';
import type { Stage } from './stage';
import type { Game } from './game';
import type { Link } from './link';
import type { Dict } from '../types';

export class Task<T extends Game = Game> {
    /** Do not trigger before / after / skip event. */
    silent: boolean = false;

    /** Leave annotation for subclass. */
    [key: string]: any;

    get game(): T {
        return room.game as T;
    }

    get path(): string {
        return this.#stage.path;
    }

    get parent(): Task | null {
        return this.#stage.parent?.task ?? null;
    }

    get #stage(): Stage {
        return room.taskMap.get(this)!;
    }

    /** Main function. */
    main(): void | Promise<void> {}

    /** Add a step in current stage. */
    add(step: string, ...args: any[]) {
        this.#stage.steps.push([step, false, args]);
    }

    /** Add a child stage in current stage. */
    addTask<T extends Task>(this: T, path: string, data?: Dict): T {
        const stage = room.createStage(path, data, this.#stage);
        this.#stage.steps.push(stage);
        return stage.task as T;
    }

    /** Add a sibline stage next to current stage. */
    addSiblingTask<T extends Task>(this: T, path: string, data?: Dict): T {
        const stage = room.createStage(path, data, this.#stage.parent!);
        const idx = this.#stage.steps.indexOf(this.#stage.parent!);
        if (idx !== -1) {
            this.#stage.steps.splice(idx + 1, 0, stage);
            return stage.task as T;
        }
        throw('failed to add sibling to ' + path);
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
        this.#stage.trigger(name);
    }

    /** Delay for a given time. */
    async sleep(duration: number = 1) {
        await this.game.utils.sleep(duration * (this.game.mode.duration ?? 0.5));
    }
}