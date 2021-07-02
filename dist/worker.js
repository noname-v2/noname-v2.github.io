(function () {
    'use strict';

    const version = '2.0.0';

    class StageAccessor {
        constructor(stage) {
            this.#stage = stage;
        }
        /** Original Stage object. */
        #stage;
        get game() {
            return this.#stage.game.accessor;
        }
        get id() {
            return this.#stage.id;
        }
        get content() {
            return this.#stage.content;
        }
        get parent() {
            return this.#stage.location ? this.#stage.location[0].accessor : null;
        }
        get current() {
            if ([0, 1].includes(this.#stage.step)) {
                return 'before';
            }
            if ([2, 3, 4].includes(this.#stage.step)) {
                return 'main';
            }
            if ([5, 6].includes(this.#stage.step)) {
                return 'after';
            }
            return null;
        }
        get skipped() {
            return this.#stage.mode === 1;
        }
        get cancelled() {
            return this.#stage.mode === 2;
        }
        get done() {
            return this.#stage.step === 7;
        }
        /** Get all siblings. */
        get siblings() {
            const siblings = [];
            for (const stage of this.#stage.location[0].getChildren(this.#stage.location[1])) {
                siblings.push(stage.accessor);
            }
            return siblings;
        }
        get results() {
            return this.#stage.results;
        }
        /** Skip stage (may trigger skip event). */
        skip() {
            if (this.#stage.step <= 2) {
                this.#stage.step = 5;
                this.#stage.mode = 1;
                return true;
            }
            return false;
        }
        /** Force stage to finish (without triggering any additional event). */
        cancel() {
            if (this.#stage.step === 0) {
                this.#stage.step = 7;
                this.#stage.mode = 2;
                return true;
            }
            return false;
        }
        /** Get the first sibling stage with name.
         * @param {string} name - Sibling name.
         */
        getSibling(select) {
            if (this.parent) {
                const siblings = this.#stage.location[0].getChildren(this.#stage.location[1]);
                for (let i = 0; i < siblings.length; i++) {
                    if (Object.is(siblings[i].accessor, this)) {
                        if (typeof select === 'number') {
                            return siblings[i + select]?.accessor ?? null;
                        }
                    }
                    else if (siblings[i].content === select || siblings[i].content.endsWith('.' + select)) {
                        return siblings[i].accessor;
                    }
                }
            }
            return null;
        }
        /** Add a child stage. */
        add(content) {
            if (!this.current) {
                throw ('stage has no location yet');
            }
            const stage = this.#stage.game.createStage(this.#stage.getContent(content), [this.#stage, this.current]);
            this.#stage.getChildren().push(stage);
            return stage.accessor;
        }
        /** Add a sibling next to this. */
        addSibling(content) {
            const stage = this.#stage.game.createStage(this.#stage.getContent(content), this.#stage.location);
            const siblings = this.#stage.location[0].getChildren(this.#stage.location[1]);
            for (let i = 0; i < siblings.length; i++) {
                if (Object.is(siblings[i].accessor, this)) {
                    siblings.splice(i + 1, 0, stage);
                    return stage.accessor;
                }
            }
            throw ('failed to add sibling');
        }
        /** Get function based on this.content. */
        getRule(content, content2, content3) {
            if (typeof content2 === 'string') {
                content = (content ?? '') + ':' + content2;
            }
            if (typeof content3 === 'string') {
                content = (content ?? '') + '/' + content3;
            }
            return this.#stage.game.getRule(this.#stage.getContent(content));
        }
        /** Create a new element. */
        create(tag) {
            return this.#stage.game.create(tag);
        }
    }

    class Stage {
        constructor(id, location, content, game) {
            /** An accessor to avoid exposing unsafe properties to extensions. */
            this.accessor = new StageAccessor(this);
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
            this.step = 0;
            /** Execution mode.
             * 0: normal
             * 1: skipped
             * 2: cancelled
             */
            this.mode = 0;
            /** Child stages added by before event. */
            this.before = [];
            /** Child stages added by main function. */
            this.main = [];
            /** Child stages added by after event. */
            this.after = [];
            /** Component updates added by main function. */
            this.updates = new Map();
            /** Component function calls added by main function. */
            this.calls = new Map();
            /** Pending return values from clients. */
            this.monitors = new Map();
            /** Return value of this.calls. */
            this.results = new Map();
            /** Resolved when all monitors are done. */
            this.resolve = null;
            this.id = id;
            this.content = content;
            this.game = game;
            this.location = location;
        }
        get resolved() {
            for (const id of this.monitors.keys()) {
                if (!this.results.has(id)) {
                    return false;
                }
            }
            return true;
        }
        /** Add component update (called by links when this.step == 2). */
        update(id, items) {
            if (this.step !== 2 && this.step !== 3) {
                throw ('cannot call update a component outside a stage');
            }
            if (!this.updates.has(id)) {
                this.updates.set(id, {});
            }
            Object.assign(this.updates.get(id), items);
            if (this.step === 3) {
                // directly push updates after main UITick in stage 2
                this.game.worker.broadcast([this.id, { [id]: items }, {}]);
            }
        }
        /** Add component function call (called by links when this.step == 2). */
        call(id, content) {
            if (this.step !== 2) {
                throw ('cannot call update a component outside a stage');
            }
            if (!this.calls.has(id)) {
                this.calls.set(id, []);
            }
            this.calls.get(id).push(content);
        }
        /** Add a callback for component function call. */
        monitor(id, content) {
            this.monitors.set(id, content);
        }
        /** Handle value returned from client. */
        onyield(id, result, done) {
            const link = this.game.links.get(id);
            const monitor = this.monitors.get(id);
            if (monitor && !done) {
                const update = this.accessor.getRule(monitor).apply(this.accessor, [link, result]);
                if (link.owner) {
                    this.game.worker.send(link.owner, [this.id, {}, { [id]: [['#yield', update]] }]);
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
                    if (!this.game.links.get(id).owner && !this.results.has(id)) {
                        this.results.set(id, '#auto');
                    }
                }
                // await return value from client
                if (!this.resolved) {
                    await new Promise(resolve => this.resolve = resolve);
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
                for (const stage of this.getChildren()) {
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
        getContent(content) {
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

    /** A link to a client-side component. */
    class Link {
        constructor(id, tag, game) {
            /** Properties synced with worker. */
            this.#props = new Map();
            this.#id = id;
            this.#game = game;
            this.set('#tag', tag);
        }
        /** Component ID. */
        #id;
        /** Properties synced with worker. */
        #props;
        /** Reference to Game. */
        #game;
        get id() {
            return this.#id;
        }
        get owner() {
            return this.get('owner');
        }
        set owner(uid) {
            this.set('owner', uid);
        }
        /** Property getter. */
        get(key) {
            return this.#props.get(key) ?? null;
        }
        /** Property setter. */
        set(key, val) {
            this.update({ [key]: val });
        }
        /** Update properties. */
        update(items) {
            for (const key in items) {
                const val = items[key] ?? null;
                val === null ? this.#props.delete(key) : this.#props.set(key, val);
            }
            this.#game.activeStage.update(this.#id, items);
        }
        /** Call a component method from its owner. Special methods:
         * #unlink: Remove reference to this.
         * #yield: Send return value of component.yield().
        */
        call(method, arg) {
            this.#game.activeStage.call(this.#id, [method, arg]);
        }
        /** Monitor the return value of a component call. */
        monitor(monitor = null) {
            this.#game.activeStage.monitor(this.#id, monitor);
        }
        /** Remove reference to a component. */
        unlink() {
            this.call('#unlink');
        }
    }

    class GameAccessor {
        constructor(game) {
            /** All available heros. */
            this.heros = [];
            /** All available cards. */
            this.cards = [];
            /** In-game players. */
            this.players = [];
            this.#game = game;
        }
        #game;
        get mode() {
            return this.#game.mode;
        }
        get config() {
            return this.#game.config;
        }
        get packs() {
            return this.#game.packs;
        }
        get disabledHeropacks() {
            return this.#game.disabledHeropacks;
        }
        get disabledCardpacks() {
            return this.#game.disabledCardpacks;
        }
        get rootStage() {
            return this.#game.rootStage.accessor;
        }
        get activeStage() {
            return this.#game.activeStage?.accessor ?? null;
        }
        get links() {
            return this.#game.links;
        }
        get uid() {
            return this.#game.worker.uid;
        }
    }

    class Game {
        constructor(content, worker) {
            /** Currently active game stage. */
            this.activeStage = null;
            /** Links to components. */
            this.links = new Map();
            /** Stage counter. */
            this.stages = new Map();
            /** Loaded extensions. */
            this.extensions = new Map();
            /** An accessor to avoid exposing unsafe properties to extensions. */
            this.accessor = new GameAccessor(this);
            self.onmessage = async ({ data: [uid, sid, id, result, done] }) => {
                if (id < 0) ;
                else if (sid === this.activeStage?.id) {
                    const link = this.links.get(id);
                    if (link?.owner === uid) {
                        this.activeStage.onyield(id, result, done);
                    }
                }
            };
            this.mode = content[0];
            this.worker = worker;
            this.rootStage = this.createStage(`${this.mode}:mode/`);
            this.packs = new Set(content[1]);
            this.disabledHeropacks = new Set(content[2]);
            this.disabledCardpacks = new Set(content[3]);
            this.config = content[4];
            const apply = (from, to) => {
                for (const key in from) {
                    if (typeof from[key] === 'object' && typeof to[key] === 'object') {
                        if (from[key] === null) {
                            delete to[key];
                        }
                        else {
                            apply(from[key], to[key]);
                        }
                    }
                    else {
                        to[key] = from[key];
                        Object.freeze(to[key]);
                    }
                }
                Object.freeze(to);
                return to;
            };
            const getRuleSet = async (name) => {
                const ext = await this.getExtension(name);
                const ruleset = ext.ruleset || {};
                if (ext.mode?.ruleset) {
                    return apply(ruleset, await getRuleSet(ext.mode.ruleset));
                }
                return ruleset;
            };
            getRuleSet(this.mode).then(async (ruleset) => {
                this.ruleset = ruleset;
                // load extensions
                for (const name of this.packs) {
                    await this.getExtension(name);
                }
                // start game
                while (await this.rootStage.next())
                    ;
                console.log('game over');
            });
        }
        async getExtension(name) {
            if (!this.extensions.has(name)) {
                this.extensions.set(name, (await import(`../extensions/${name}/main.js`)).default);
            }
            return this.extensions.get(name);
        }
        create(tag) {
            const id = this.links.size + 1;
            const link = new Link(id, tag, this);
            this.links.set(id, link);
            return link;
        }
        createStage(name, parent) {
            const id = this.stages.size + 1;
            const stage = new Stage(id, parent ?? null, name, this);
            this.stages.set(id, stage);
            return stage;
        }
        /** Get the function based on string. Format:
         * #<path>: from this.ruleset
         * <extname>:<path>?<section>: from an extension
         */
        getRule(content) {
            let rule;
            let path;
            // get ruleset or extension
            if (content[0] === '#') {
                rule = this.ruleset;
                path = content.slice(1);
            }
            else {
                [rule, path] = content.split(':');
                rule = this.extensions.get(rule);
            }
            // get target
            const [keys, section] = path.split('/');
            for (const key of keys.split('.')) {
                rule = rule[key];
            }
            // return section of the target
            if (section) {
                return rule.contents[section];
            }
            else if (section === '') {
                return rule.content;
            }
            else {
                return rule;
            }
        }
        /** Backup game progress. */
        async backup() {
            //////
        }
    }

    /**
     * Manager of component syncing between client and server.
     */
    class Worker {
        /**
         * Setup communication.
         */
        constructor() {
            /** Worker version. */
            this.version = version;
            /** Game object. */
            this.game = null;
            /** Connected hub. */
            this.connection = null;
            self.onmessage = ({ data }) => {
                this.uid = data[0];
                this.game = new Game(data[3], this);
            };
            self.postMessage('ready');
        }
        /** Send a message to all clients. */
        broadcast(tick) {
            if (this.game && this.connection) ;
            else {
                this.tick(tick);
            }
        }
        /** Send a message to a client. */
        send(uid, tick) {
            if (this.game && this.connection) ;
            else if (uid === this.uid) {
                this.tick(tick);
            }
        }
        /** Send a message to local client. */
        tick(tick) {
            self.postMessage(tick);
        }
    }

    const worker = new Worker();
    globalThis.worker = worker;

}());
