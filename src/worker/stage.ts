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
     * 3: execute this.calls (user interaction)
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

    /** Component added or removed by main function. */
    tagChanges = new Map<number, string | null>();

    /** Component updates added by main function. */
    propChanges = new Map<number, {[key: string]: any}>();

    /** Pending return values from clients. */
    monitors = new Map<number, string>();

    /** Return value of this.calls. */
    results = new Map<number, any>();

    /** Resolved when all monitors are done. */
    private resolve: (() => void) | null = null;

    get resolved() {
        for (const val of this.results.values()) {
            if (val === null) {
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

    /** Add a callback for component function call. */
    monitor(id: number, content: string) {
        this.monitors.set(id, content);
    }

    /** Pause step 3 until a return value is received. */
    await(id: number) {
        this.results.set(id, null);
    }

    /** Handle value returned from client. */
    dispatch(id: number, result: any, done: boolean) {
        if (done) {
            if (this.results.get(id) === null) {
                this.results.set(id, result ?? '#auto');
                if (this.resolve && this.resolved) {
                    this.resolve();
                }
            }
        }
        else {
            const monitor = this.monitors.get(id);
            if (monitor) {
                const link = this.game.links.get(id)!;
                this.accessor.getRule(monitor).apply(this.accessor, [link, result]);
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
            if (!this.game.arena) {
                this.game.arena = this.game.create('arena');
            }

            // apply postponded UI updates from previous stages
            for (const [id, item] of this.game.pendingUpdates) {
                this.game.update(id, item);
            }
            
            // execute main stage function
            await this.game.getRule('#stage.main/').apply(this.accessor);
            this.game.worker.broadcast([this.id, Object.fromEntries(this.tagChanges), Object.fromEntries(this.propChanges), {}]);
        }
        else if (this.step === 3) {
            // set the result of components without owners as '#auto'
            for (const [id, val] of this.results.entries()) {
                if (val === null) {
                    const owner = this.game.links.get(id)!.owner;
                    const peers = this.game.worker.peers;
                    if (!owner || (peers && !peers.has(owner))) {
                        this.results.set(id, '#auto');
                    }
                }
            }
            
            // await return value from client
            if (!this.resolved) {
                await new Promise<void>(resolve => this.resolve = resolve);
                this.resolve = null;
            }
            this.game.activeStage = null;

            // clear unlinked components
            for (const [id, tag] of this.tagChanges.entries()) {
                if (tag === null) {
                    this.game.links.delete(id);
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

            // backup before user interaction in step 3
            if (this.step === 3 && this.monitors.size) {
                await this.game.backup();
            }
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
