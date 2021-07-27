import type { Game } from './game';
import type { Task } from './task';
import { apply, Dict } from '../utils';

export class Stage {
    /** Stage ID. */
    id: number;

    /** Child task triggered by before or after event. */
    trigger: string | null = 'trigger';

    /** Main task. */
    tasks: [Task | null, Task, Task | null];

    /** Child steps of task objects.
     * Stage: child stage
     * array: [function name, executed, function arguments]
     * Dict: 
     */
    steps = new Map<Task, (Stage | [string, boolean, any[]])[]>();

    /** Parent stage. */
    parent: Stage | null = null;

    /** Current state of execution. Action:
     * 0: call this.preTask.main()
     * 1: execute child stages this.preTask
     * 2: call this.task.main()
     * 3: execute child stages of this.task
     * 4: call this.postTask.main()
     * 5: execute child stages of this.postTask
     * 6: no action (done)
    */
    progress = 0;

    /** Main task skipped */
    skipped = false;

    /** Handler of component.yield(). */
    monitors = new Map<number, string>();

    /** Awaiting values from component.return(). */
    awaits = new Map<number, string | null>();

    /** Values from component.return(). */
    results: Dict = {};

    /** Reference to game object. */
    #game: Game;

    /** Get task based on current progress. */
    get task() {
        if (this.progress >= 0) {
            return this.tasks[Math.floor(this.progress / 2)] ?? null;
        }
        return null;
    }

    constructor(id: number, path: string, data: Dict, game: Game) {
        this.id = id;
        this.#game = game;

        // main task, pre-task and post-task
        const task = apply(new (game.getTask(path))(this, this.#game), data);
        const preTask = this.trigger ? new (game.getTask(this.trigger))(this, this.#game) : null;
        const postTask = this.trigger ? new (game.getTask(this.trigger))(this, this.#game) : null;
        this.tasks = [preTask, task, postTask];
    }

    /** Execute the next step.
     * @returns {boolean | null}
     * true: stage progressed
     * false: stage not progressed
     * null: await user input
     */
    async next(): Promise<boolean | null> {
        // check if trigger stage is skipped
        if (!this.trigger && [0, 1, 4, 5].includes(this.progress)) {
            this.progress++;
            return true;
        }

        // check if stage is finished
        const task = this.task;
        if (!task) {
            return false;
        }
        
        this.#game.currentStage = this;

        // check if stage is awaiting user input
        if (this.awaits.size) {
            return null;
        }
        this.monitors.clear();

        if (this.progress % 2 === 0) {
            // call task.main()
            try {
                await task.main();
            }
            catch (e) {
                console.log(e);
            }
        }
        else {
            // execute child steps of current task
            const steps = this.steps.get(task)!;
            for (const step of steps) {
                if (Array.isArray(step)) {
                    // call a task method
                    if (step[1] === false) {
                        try {
                            await (task as any)[step[0]](...step[2]);
                        }
                        catch (e) {
                            console.log(e);
                        }
                        step[1] = true;
                        return true;
                    }
                }
                else if (step instanceof Stage) {
                    // execute child stage
                    // (this.#game.currentStage will not change if next == false)
                    const next = await step.next();
                    if (next !== false) {
                        return next;
                    }
                }
            }
        }
        
        // increment progress if task.main() is called or all child steps done
        this.progress++;
        return true;
    }
}
