import { globals } from './globals';
import type { Accessor } from './accessor';
import type { Link, Dict } from '../types';

export class Task<T extends Accessor = Accessor> {
    /** Do not trigger before / after / skip event. */
    silent: boolean = false;

    /** Leave annotation for subclass. */
    [key: string]: any;

    get game(): T {
        return globals.accessor as T;
    }

    get path(): string {
        return globals.taskStage.get(this)!.path;
    }

    get parent(): Task | null {
        return globals.taskStage.get(this)!.parent?.task ?? null;
    }

    get results(): Dict {
        return globals.taskStage.get(this)!.results;
    }

    /** Main function. */
    main(): void | Promise<void> {}

    /** Create a link. */
    create(tag: string): Link {
        return globals.game.create(tag);
    }

    /** Add a step in current stage. */
    add(step: string, ...args: any[]) {
        globals.taskStage.get(this)!.steps.push([step, false, args]);
    }

    /** Add a child stage in current stage. */
    addTask<T extends Task>(this: T, path: string, data?: Dict): T {
        const self = globals.taskStage.get(this)!;
        const stage = globals.game.createStage(path, data, self);
        self.steps.push(stage);
        return stage.task as T;
    }

    /** Add a sibline stage next to current stage. */
    addSiblingTask<T extends Task>(this: T, path: string, data?: Dict): T {
        const self = globals.taskStage.get(this)!;
        const stage = globals.game.createStage(path, data, self.parent!);
        const idx = self.steps.indexOf(self.parent!);
        if (idx !== -1) {
            self.steps.splice(idx + 1, 0, stage);
            return stage.task as T;
        }
        throw('failed to add sibling to ' + path);
    }

    /** Add a callback for component function call. */
    monitor(link: Link, callback: string) {
        globals.taskStage.get(this)!.monitors.set(link.id, callback);
    }

    /** Pause step 2 until a return value is received. */
    await(link: Link, tag?: string) {
        globals.taskStage.get(this)!.awaits.set(link.id, tag ?? null);
    }

    /** Skip stage (may trigger skip event). */
    skip() {
        const self = globals.taskStage.get(this)!;
        if (self.progress < 2) {
            self.skipped = true;
            self.awaits.clear();
            self.monitors.clear();
            return true;
        }
        return false;
    }

    /** Force stage to finish (without triggering skip event). */
    cancel() {
        const self = globals.taskStage.get(this)!;
        self.progress = -1;
        self.awaits.clear();
        self.monitors.clear();
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
        globals.taskStage.get(this)!.trigger(name);
    }
}