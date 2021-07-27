import type { Game } from './game';
import type { Task } from './task';
import { apply, Dict } from '../utils';

export class Stage {
    /** Stage ID. */
    id: number;

    /** Path to main task constructor. */
    path: string;

    /** Main task object. */
    task: Task;

    /** Child steps of task objects.
     * Stage: child stage
     * array: [function name, executed, function arguments]
     * Dict: 
     */
    steps: (Stage | [string, boolean, any[]])[] = [];

    /** Parent stage. */
    parent: Stage | null = null;

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
    monitors = new Map<number, string>();

    /** Awaiting values from component.return(). */
    awaits = new Map<number, string | null>();

    /** Values from component.return(). */
    results: Dict = {};

    /** Reference to game object. */
    #game: Game;

    /** Stage may trigger before and after event. */
    #trigger: boolean = true;

    constructor(id: number, path: string, data: Dict, game: Game) {
        this.id = id;
        this.path = path;
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
        // check if stage is cancelled / done /skipped
        if (this.progress < 0 || this.progress >= 6) {
            return false;
        }

        if ((this.skipped && this.progress < 4) ||
            (!this.#trigger && [0, 1, 4, 5].includes(this.progress))) {
            this.progress++;
            return true;
        }

        // check if stage is awaiting user input
        this.#game.currentStage = this;
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
        const stage = this.#game.createStage('trigger', {event});
        stage.parent = this;
        stage.#trigger = false;
        this.steps.push(stage);
    }
}
