import { StageAccessor } from './stage-acc';
import type { Game } from './game';

export type StageLocation = 'before' | 'main' | 'after';

export class Stage {
    /** Stage ID. */
    id: number;

    /** Path to the function to be executed.
     * ruleset item: <section>.<rule>
     * mode: <extension>:mode
     * skill: <extension>:skill.<skillname>
     * card: <extension>:card.<cardname>
     * hero: <extension>:hero.<heroname>
    */
    content: string;

    /** Reference to game object. */
    game: Game;

    /** An accessor to avoid exposing unsafe properties to extensions. */
    accessor = new StageAccessor(this);

    /** Current step of execution. Action:
     * 0: generate this.before
     * 1: execute this.before
     * 2: generate this.calls and this.main and update components (main content)
     * 3: execute this.calls
     * 4: execute this.main
     * 5: generate this.after
     * 6: execute this.after
     * 7: no action (done)
    */
    step = 0;

    /** Execution mode.
     * 0: normal
     * 1: skipped
     * 2: cancelled
     */
    mode = 0;

    /** Parent stage. */
    location: [Stage, StageLocation] | null;

    /** Child stages added by before event. */
    before = <Stage[]>[];

    /** Child stages added by main function. */
    main = <Stage[]>[];

    /** Child stages added by after event. */
    after = <Stage[]>[];

    /** Component updates added by main function. */
    updates = new Map<number, {[key: string]: any}>();

    /** Component function calls added by main function. */
    calls = new Map<number, [string, any][]>();

    /** Pending return values from clients. */
    monitors = new Map<number, string | null>();

    /** Return value of this.calls. */
    results = new Map<number, any>();

    /** Resolved when all monitors are done. */
    private resolve: (() => void) | null = null;

    get resolved() {
        for (const id of this.monitors.keys()) {
            if (!this.results.has(id)) {
                return false;
            }
        }
        return true;
    }

    constructor(id: number, location: [Stage, StageLocation] | null, content: string, game: Game) {
        this.id = id;
        this.content = content;
        this.game = game;
        this.location = location;
    }

    /** Add component update (called by links when this.step == 2). */
    update(id: number, items: {[key: string]: any}) {
        if (this.step !== 2 && this.step !== 3) {
            throw('cannot call update a component outside a stage');
        }
        if (!this.updates.has(id)) {
            this.updates.set(id, {});
        }
        Object.assign(this.updates.get(id), items);

        if (this.step === 3) {
            // directly push updates after main UITick in stage 2
            this.game.worker.broadcast([this.id, {[id]: items}, {}]);
        }
    }

    /** Add component function call (called by links when this.step == 2). */
    call(id: number, content: [string, any]) {
        if (this.step !== 2) {
            throw('cannot call update a component outside a stage');
        }
        if (!this.calls.has(id)) {
            this.calls.set(id, []);
        }
        this.calls.get(id)!.push(content);
    }

    /** Add a callback for component function call. */
    monitor(id: number, content: string | null) {
        this.monitors.set(id, content);
    }

    /** Handle value returned from client. */
    onyield(id: number, result: any, done: boolean) {
        const link = this.game.links.get(id)!;
        const monitor = this.monitors.get(id);
        if (monitor && !done) {
            const update = this.accessor.getRule(monitor).apply(this.accessor, [link, result]);
            if (link.owner) {
                this.game.worker.send(link.owner, [this.id, {}, {[id]: [['#yield', update]]}]);
            }
        }
        if (done) {
            this.results.set(id, result);
            if (this.resolve && this.resolved) {
                this.resolve();
            }
        }
    }

    /** Get child stages based on current step. */
    getChildren(current = this.accessor.current) {
        if (current === 'before') {
            return this.before;
        }
        if (current === 'main') {
            return this.main;
        }
        if (current === 'after') {
            return this.after;
        }
        return null;
    }

    /** Execute the next step. */
    async next() {
        if (this.accessor.done) {
            return false;
        }
        let incr = true;

        if (this.step === 0) {
            // generate this.before
            await this.game.getRule('#stage.before/').apply(this.accessor);
        }
        else if (this.step === 2) {
            // generate this.calls and this.main and update components (main content)
            this.game.activeStage = this;
            await this.accessor.getRule().apply(this.accessor);
            this.game.worker.broadcast([this.id, Object.fromEntries(this.updates), {}]);
        }
        else if (this.step === 3) {
            // backup before user interaction
            if (this.monitors.size) {
                await this.game.backup();
            }

            // call component methods
            this.results.clear();
            this.game.worker.broadcast([this.id, {}, Object.fromEntries(this.calls)]);
            
            // fill components without owners
            for (const id of this.monitors.keys()) {
                if (!this.game.links.get(id)!.owner && !this.results.has(id)) {
                    this.results.set(id, '#auto');
                }
            }
            
            // await return value from client
            if (!this.resolved) {
                await new Promise<void>(resolve => this.resolve = resolve);
                this.resolve = null;
            }
            this.game.activeStage = null;

            // clear unlinked components
            for (const [id, calls] of this.calls.entries()) {
                for (const [method] of calls) {
                    if (method === '#unlink') {
                        this.game.links.delete(id);
                    }
                }
            }
        }
        else if (this.step === 5) {
            // generate this.after
            await this.game.getRule('#stage.after/').apply(this.accessor);
        }
        else if (this.accessor.current) {
            // execute this.before / this.main / this.after
            for (const stage of this.getChildren()!) {
                if (!stage.accessor.done) {
                    await stage.next();
                    incr = false;
                    break;
                }
            }
        }

        if (incr) {
            this.step++;
        }
        return true;
    }

    /** Get function based on this.content.
     * includes(':'): absolute path
     * startsWith(':'): absolute path in current extension
     * startsWith('#'): from game.ruleset
    */
    getContent(content?: string | null) {
        if (typeof content === 'string') {
            if (content[0] === ':') {
                // absolute path in current extension
                return this.content.split(':')[0] + ':' + content.split(':')[1];
            }
            else if (content[0] !== '#' && !content.includes(':')) {
                // relative path
                return this.content.split('/')[0] + '/' + content;
            }
            return content;
        }
        else {
            return this.content;
        }
    }
}
