import type { Game } from './game';
import type { Worker } from './worker';

export type StageLocation = 'before' | 'main' | 'after';
export type StageCallback = (id: number, result: any, done: boolean) => void;
type SetStage = (this: Game, content?: [Stage, StageCallback]) => void;

export class Stage {
    /** Stage ID. */
    #id: number;

    /** Path to the function to be executed.
     * ruleset item: <section>.<rule>
     * mode: <extension>:mode
     * skill: <extension>:skill.<skillname>
     * card: <extension>:card.<cardname>
     * hero: <extension>:hero.<heroname>
    */
    #path: string;

    /** Reference to game object. */
    #game: Game;

    /** Reference to worker object. */
    #worker: Worker;

    /** Current step of execution. Action:
     * 0: generate this.before
     * 1: execute this.before
     * 2: execute main function and update components
     * 3: execute this.main
     * 4: generate this.after
     * 5: execute this.after
     * 6: no action (done)
    */
    #step = 0;

    /** Execution status.
     * 0: normal
     * 1: skipped
     * 2: cancelled
     */
    #code = 0;

    /** Parent stage. */
    #location: [Stage, StageLocation] | null;

    /** Child stages added by before event. */
    #before = <Stage[]>[];

    /** Child stages added by main function. */
    #main = <Stage[]>[];

    /** Child stages added by after event. */
    #after = <Stage[]>[];

    /** Pending return values from clients. */
    #monitors = new Map<number, string>();

    /** Return value of this.calls. */
    #results = new Map<number, any>();

    /** Resolved when all monitors are done. */
    #resolve: (() => void) | null = null;

    /** Make self as game.activateStage. */
    #setStage: SetStage;

    /** Input data. */
    input: {[key: string]: any} = {};

    /** Output data. */
    output: {[key: string]: any} = {};

    get id() {
        return this.#id;
    }

    get skipped() {
        return this.#code === 1;
    }

    get cancelled() {
        return this.#code === 2;
    }

    get done() {
        return this.#step >= 6;
    }
    
    get parent(): Stage | null {
        return this.#location ? this.#location[0] : null;
    }

    /** Get all siblings. */
    get siblings(): Stage[] {
        if (this.#location) {
            return this.#location[0].#getChildren(this.#location[1])!
        }
        else {
            return [];
        }
    }

    get results() {
        return this.#results;
    }

    get game() {
        return this.#game;
    }

    constructor(id: number, location: [Stage, StageLocation] | null,
        path: string, game: Game, worker: Worker, setStage: SetStage) {
        this.#id = id;
        this.#path = path;
        this.#game = game;
        this.#worker = worker;
        this.#location = location;
        this.#setStage = setStage;

        if (id === 1) {
            setTimeout(() => this.#run());
        }
    }

    /** Add a callback for component function call. */
    monitor(id: number, path: string) {
        this.#monitors.set(id, path);
    }

    /** Pause step 2 until a return value is received. */
    await(id: number) {
        this.#results.set(id, null);
    }

    /** Skip stage (may trigger skip event). */
    skip() {
        if (this.#step <2 ) {
            this.#step = 4;
            this.#code = 1;
            return true;
        }
        return false;
    }

    /** Force stage to finish (without triggering any additional event). */
    cancel() {
        if (this.#step === 0) {
            this.#step = 7;
            this.#code = 2;
            return true;
        }
        return false;
    }

    /** Get the first sibling stage with name.
     * @param {string} name - Sibling name.
     */
    getSibling(select: string | number): Stage | null {
        const siblings = this.siblings;
        if (siblings) {
            for (let i = 0; i < siblings.length; i++) {
                if (Object.is(siblings[i], this)) {
                    if (typeof select === 'number') {
                        return siblings[i + select] ?? null;
                    }
                }
                else if (siblings[i].#path === select || siblings[i].#path.endsWith('/' + select)) {
                    return siblings[i];
                }
            }
        }
        return null;
    }

    /** Add a child stage. */
    add(path: string) {
        const stage = this.game.createStage(this.#getPath(path), [this, this.#getLocation()!]);
        this.#getChildren()!.push(stage);
        return stage;
    }

    /** Add a sibling next to this. */
    addSibling(path: string) {
        const stage = this.game.createStage(this.#getPath(path), this.#location!);
        const siblings = this.siblings!;
        for (let i = 0; i < siblings.length; i++) {
            if (Object.is(siblings[i], this)) {
                siblings.splice(i + 1, 0, stage);
                return stage;
            }
        }
        throw('failed to add sibling');
    }

    /** Execute root stage until all done or game over. */
    async #run() {
        if (Object.is(this.game.rootStage, this)) {
            while(this.#game.state < 2 && await this.#next());
            console.log('game over');
        }
    }

    /** Execute the next step. */
    async #next() {
        if (this.done) {
            return false;
        }
        let incr = true;

        if (this.#step === 0) {
            // generate this.before
            await this.game.getRule('#stage.before/').apply(this);
        }
        else if (this.#step === 2) {
            // execute main stage function
            this.#setStage.call(this.game, [this, this.#dispatch]);
            await this.game.getRule('#stage.main/').apply(this);
            
            // set the result of components without owners as '#auto'
            for (const [id, val] of this.results.entries()) {
                if (val === null) {
                    const owner = this.game.links.get(id)!.owner;
                    const peers = this.#worker.peers;
                    if (!owner || (peers && !peers.has(owner))) {
                        this.results.set(id, '#auto');
                    }
                }
            }
            
            // await return value from client
            if (!this.#checkResolve()) {
                await new Promise<void>(resolve => this.#resolve = resolve);
                this.#resolve = null;
            }

            // remove active stage
            this.#setStage.call(this.game);
        }
        else if (this.#step === 4) {
            // generate this.after
            await this.game.getRule('#stage.after/').apply(this);
        }
        else if (this.#getLocation()) {
            // execute this.before / this.main / this.after
            for (const stage of this.#getChildren()!) {
                if (!stage.done) {
                    await stage.#next();
                    incr = false;
                    break;
                }
            }
        }

        if (incr) {
            this.#step++;

            if (this.#step === 2) {
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
    #getPath(content?: string | null) {
        if (typeof content === 'string') {
            if (content[0] === ':') {
                // absolute path in current extension
                return this.#path.split(':')[0] + ':' + content.split(':')[1];
            }
            else if (content[0] !== '#' && !content.includes(':')) {
                // relative path
                return this.#path.split('/')[0] + '/' + content;
            }
            return content;
        }
        else {
            return this.#path;
        }
    }

    /** Handle value returned from client. */
    #dispatch(id: number, result: any, done: boolean) {
        if (this.#step !== 3) {
            return;
        }
        if (done) {
            // results: component.return() -> link.await()
            if (this.results.get(id) === null) {
                this.results.set(id, result ?? '#auto');
                if (this.#resolve && this.#checkResolve()) {
                    this.#resolve();
                }
            }
        }
        else {
            // results: component.yield() -> link.monitor()
            const monitor = this.#monitors.get(id);
            if (monitor) {
                const link = this.#game.links.get(id)!;
                this.game.getRule(this.#getPath(monitor)).apply(this, [link, result]);
            }
        }
    }
    
    /** All awaits have been resolved. */
    #checkResolve() {
        for (const val of this.results.values()) {
            if (val === null) {
                return false;
            }
        }
        return true;
    }

    #getLocation(): StageLocation | null {
        if ([0, 1].includes(this.#step)) {
            return 'before';
        }
        if ([2, 3].includes(this.#step)) {
            return 'main';
        }
        if ([4, 5].includes(this.#step)) {
            return 'after';
        }
        return null;
    }

    /** Get child stages based on current step. */
    #getChildren(location=this.#getLocation()) {
        if (location === 'before') {
            return this.#before;
        }
        if (location === 'main') {
            return this.#main;
        }
        if (location === 'after') {
            return this.#after;
        }
        return null;
    }
}
