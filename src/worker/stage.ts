import type { Game } from './game';
import type { Task } from './task';
import { apply, Dict } from '../utils';

export class Stage {
    /** Stage ID. */
    readonly id: number;

    /** Path to main task constructor. */
    readonly path: string;

    /** Main task object. */
    readonly task: Task;

    /** Child steps of task objects.
     * Stage: child stage
     * array: [function name, executed, function arguments]
     * Dict: 
     */
    readonly steps: (Stage | [string, boolean, any[]])[] = [];

    /** Parent stage. */
    readonly parent: Stage | null;

    /** Current state of execution.
     * -1: no action (cancelled)
     * 0: trigger before event
     * 1: execute steps added by before event
     * 2: call this.task.main()
     * 3: execute steps added by this.task.main()
     * 4: trigger after event
     * 5: execute steps added by after event
     * 6: no action (done)
    */
    progress = 0;

    /** Main task skipped */
    skipped = false;

    /** Handler of component.yield(). */
    readonly monitors = new Map<number, string>();

    /** Awaiting values from component.respond(). */
    readonly awaits = new Map<number, string | null>();

    /** Values from component.respond(). */
    readonly results: Dict = {};

    /** Reference to game object. */
    #game: Game;

    constructor(id: number, path: string, data: Dict, parent: Stage | null, game: Game) {
        this.id = id;
        this.path = path;
        this.parent = parent;
        this.task = apply(new (game.getTask(path))(this, game), data);
        this.#game = game;
    }

    /** Execute the next step.
     * @returns {boolean | null}
     * true: stage progressed
     * false: stage not progressed
     * null: await user input
     */
    async next(): Promise<boolean | null> {
        // check if stage is done or cancelled
        if (this.progress < 0 || this.progress >= 6) {
            return false;
        }

        // check if current step is skipped
        this.#game.currentStage = this;
        if ((this.skipped && this.progress < 4) ||
            (this.task.silent && [0, 1, 4, 5].includes(this.progress))) {
            this.progress++;
            return true;
        }

        // check if stage is awaiting user input
        if (this.awaits.size) {
            return null;
        }
        this.monitors.clear();

        if (this.progress === 0) {
            // trigger before event
            this.trigger('before');
        }
        else if (this.progress === 2) {
            // call task.main()
            try {
                await this.task.main();
            }
            catch (e) {
                console.log(e);
            }
        }
        else if (this.progress === 4) {
            // trigger after or skip event
            this.trigger(this.skipped ? 'skipped' : 'after');
        }
        else {
            // execute child steps of current task
            for (const step of this.steps) {
                if (Array.isArray(step)) {
                    // call a task method
                    if (step[1] === false) {
                        try {
                            await (this.task as any)[step[0]](...step[2]);
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
        
        this.progress++;
        return true;
    }

    /** Trigger an event. */
    trigger(event: string | null = null) {
        const stage = this.#game.createStage('trigger', {event}, this);
        stage.task.silent = true;
        this.steps.push(stage);
    }
}
