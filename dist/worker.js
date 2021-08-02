(function () {
    'use strict';

    /** Deep copy plain object. */
    function copy(from) {
        const to = {};
        for (const key in from) {
            if (from[key]?.constructor === Object) {
                to[key] = copy(from[key]);
            }
            else if (from[key] !== null && from[key] !== undefined) {
                to[key] = from[key];
            }
        }
        return to;
    }
    /** Merge two objects. */
    function apply(to, from) {
        for (const key in from) {
            if (to[key]?.constructor === Object && from[key]?.constructor === Object) {
                apply(to[key], from[key]);
            }
            else if (from[key] !== null && from[key] !== undefined) {
                to[key] = from[key];
            }
        }
        return to;
    }
    /** Deep freeze object. */
    function freeze(obj) {
        const propNames = Object.getOwnPropertyNames(obj);
        for (const name of propNames) {
            const value = obj[name];
            if (value && typeof value === 'object') {
                freeze(value);
            }
        }
        return Object.freeze(obj);
    }
    /** Access key of a nested object. */
    function access(obj, keys) {
        if (keys && obj) {
            for (const key of keys.split('.')) {
                obj = obj[key] ?? null;
                if (obj === null) {
                    break;
                }
            }
        }
        return obj ?? null;
    }
    /** Split string with `:`. */
    function split(msg, delimiter = ':') {
        const idx = msg.indexOf(delimiter);
        if (idx === -1) {
            return [msg, ''];
        }
        else {
            return [msg.slice(0, idx), msg.slice(idx + 1)];
        }
    }

    class Stage {
        /** Stage ID. */
        id;
        /** Path to main task constructor. */
        path;
        /** Main task object. */
        task;
        /** Child steps of task objects.
         * Stage: child stage
         * array: [function name, executed, function arguments]
         * Dict:
         */
        steps = [];
        /** Parent stage. */
        parent;
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
        monitors = new Map();
        /** Awaiting values from component.respond(). */
        awaits = new Map();
        /** Values from component.respond(). */
        results = {};
        /** Reference to game object. */
        #game;
        constructor(id, path, data, parent, game) {
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
        async next() {
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
                                await this.task[step[0]](...step[2]);
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
        trigger(event = null) {
            const stage = this.#game.createStage('trigger', { event }, this);
            stage.task.silent = true;
            this.steps.push(stage);
        }
    }

    /** Internal context. */
    const globals = {};
    ////// debug
    globalThis.globals = globals;

    class Task {
        /** Game stage that task belongs to. */
        #stage;
        /** Accessor of game objects. */
        #game;
        /** Do not trigger before / after / skip event. */
        silent = false;
        get game() {
            return globals.accessor;
        }
        get path() {
            return this.#stage.path;
        }
        get parent() {
            return this.#stage.parent?.task ?? null;
        }
        get results() {
            return this.#stage.results;
        }
        constructor(stage, game) {
            this.#stage = stage;
            this.#game = game;
        }
        /** Main function. */
        main() { }
        /** Create a link. */
        create(tag) {
            return this.#game.create(tag);
        }
        /** Add a step in current stage. */
        add(step, ...args) {
            this.#stage.steps.push([step, false, args]);
        }
        /** Add a child stage in current stage. */
        addTask(path, data) {
            const stage = this.#game.createStage(path, data, this.#stage);
            this.#stage.steps.push(stage);
            return stage.task;
        }
        /** Add a sibline stage next to current stage. */
        addSiblingTask(path, data) {
            const stage = this.#game.createStage(path, data, this.#stage.parent);
            const idx = this.#stage.steps.indexOf(this.#stage.parent);
            if (idx !== -1) {
                this.#stage.steps.splice(idx + 1, 0, stage);
                return stage.task;
            }
            throw ('failed to add sibling to ' + path);
        }
        /** Add a callback for component function call. */
        monitor(link, callback) {
            this.#stage.monitors.set(link.id, callback);
        }
        /** Pause step 2 until a return value is received. */
        await(link, tag) {
            this.#stage.awaits.set(link.id, tag ?? null);
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
        trigger(name) {
            if (name === 'before' || name === 'after' || name === 'skip') {
                throw ('reserved event name: ' + name);
            }
            return this.#stage.trigger(name);
        }
    }

    /** Hub related functions. */
    const hub = {
        connect: (url) => globals.worker.connect(url),
        disconnect: () => globals.worker.disconnect(),
        syncRoom: () => globals.game.syncRoom()
    };
    /** Accessor of game and worker properties and methods. */
    class Accessor {
        get owner() {
            return globals.worker.uid;
        }
        get arena() {
            return globals.game.arena;
        }
        get mode() {
            return globals.game.mode;
        }
        get config() {
            return globals.game.config;
        }
        get packs() {
            return globals.game.packs;
        }
        get banned() {
            return globals.game.banned;
        }
        get playerLinks() {
            return globals.worker.getPeers({ playing: true });
        }
        get spectatorLinks() {
            return globals.worker.getPeers({ playing: false });
        }
        get hub() {
            return hub;
        }
        /** Get a link. */
        get(id) {
            return globals.game.links.get(id);
        }
        /** Create a link. */
        create(tag) {
            return globals.game.create(tag);
        }
        /** Creata a class in game.#gameClasses. */
        createInstance(name, ...args) {
            return new (globals.game.getClass(name))(...args);
        }
        /** Access extension content. */
        getExtension(path) {
            return globals.game.getExtension(path);
        }
        /** Get links to peers. */
        getPeers(filter) {
            return globals.worker.getPeers(filter);
        }
        /** Mark game as started. */
        start() {
            globals.game.start();
        }
        /** Mark game as over. */
        over() {
            globals.game.over();
        }
    }

    /** Map of loaded extensions. */
    const extensions = new Map();
    /** Load extension. */
    async function importExtension(extname) {
        if (!extensions.has(extname)) {
            const ext = freeze((await import(`../extensions/${extname}/main.js`)).default);
            extensions.set(extname, ext);
        }
        return extensions.get(extname);
    }
    /** Get imported extension. */
    function getExtension(extname) {
        return extensions.get(extname);
    }

    class Game {
        /** Root game stage. */
        rootStage;
        /** Current game stage. */
        currentStage;
        /** Links to components. */
        links = new Map();
        /** Game mode. */
        mode = {};
        /** Game configuration. */
        config;
        /** Hero packages. */
        packs;
        /** Banned packages. */
        banned = {
            heropacks: new Set(),
            cardpacks: new Set(),
            heros: new Set(),
            cards: new Set(),
        };
        /** Arena link. */
        arena;
        /** Game progress.
         * 0: waiting
         * 1: gaming
         * 2: over
        */
        progress = 0;
        /** All created stages. */
        #stages = new Map();
        /** Array of packages that define mode tasks (priority: high -> low). */
        #ruleset = [];
        /** Map of task classes. */
        #taskClasses = new Map();
        /** Base game classes. */
        #gameClasses = new Map([['game', Accessor], ['task', Task]]);
        /** Number of links created. */
        #linkCount = 0;
        /** Number of stages created. */
        #stageCount = 0;
        /** Currently paused by stage.awaits. */
        #paused = true;
        init(content) {
            this.packs = new Set(content[1]);
            this.banned.heropacks = new Set(content[2]);
            this.banned.cardpacks = new Set(content[3]);
            this.config = content[4];
            globals.worker.info = content[5];
            // load extensions
            Promise.all(content[1].map(mode => importExtension(mode))).then(() => this.#loadMode(content[0]));
        }
        /** Create a link. */
        create(tag) {
            const id = ++this.#linkCount;
            const obj = {};
            // reserved link keys
            const reserved = {
                id, tag,
                call: (method, arg) => {
                    globals.worker.tick(id, [method, arg]);
                },
                unlink: () => {
                    globals.worker.tick(id, null);
                    this.links.delete(id);
                },
                update: (items) => {
                    for (const key in items) {
                        const val = items[key] ?? null;
                        val === null ? delete obj[key] : obj[key] = val;
                    }
                    globals.worker.tick(id, items);
                }
            };
            const link = new Proxy(obj, {
                get(_, key) {
                    if (key in reserved) {
                        return reserved[key];
                    }
                    else {
                        return obj[key];
                    }
                },
                set(_, key, val) {
                    if (key in reserved) {
                        return false;
                    }
                    else {
                        reserved.update({ [key]: val });
                        return true;
                    }
                }
            });
            this.links.set(id, [link, obj]);
            globals.worker.tick(id, tag);
            return link;
        }
        /** Create a stage. */
        createStage(path, data, parent) {
            const id = ++this.#stageCount;
            const stage = new Stage(id, path, data ?? {}, parent ?? null, this);
            this.#stages.set(id, stage);
            return stage;
        }
        /** Access extension content. */
        getExtension(path) {
            const [ext, keys] = path.split(':');
            return access(getExtension(ext), keys) ?? null;
        }
        /** Get or create task constructor. */
        getTask(path) {
            if (!this.#taskClasses.has(path)) {
                // get task from extension sections
                const section = this.getExtension(path);
                const cls = section.inherit ? this.getTask(section.inherit) : Task;
                this.#taskClasses.set(path, section.task(cls));
            }
            return this.#taskClasses.get(path);
        }
        /** Get a game class. */
        getClass(path) {
            return this.#gameClasses.get(path);
        }
        /** Update room info for idle clients. */
        syncRoom(push = true) {
            const room = JSON.stringify([
                // mode name
                this.mode.name,
                // joined players
                globals.worker.getPeers({ playing: true })?.length ?? 1,
                // number of players in a game
                this.config.np,
                // nickname and avatar of owner
                globals.worker.info,
                // game state
                this.progress
            ]);
            if (push) {
                globals.worker.connection?.send('edit:' + room);
            }
            return room;
        }
        /** Get a UITick of all links. */
        pack() {
            const tags = {};
            const props = {};
            for (const [uid, [link, obj]] of this.links.entries()) {
                tags[uid] = link.tag;
                props[uid] = obj;
            }
            return [this.currentStage.id, tags, props, {}];
        }
        /** Mark game as started and disallow changing configuration. */
        start() {
            freeze(this.mode);
            freeze(this.config);
            freeze(this.packs);
            freeze(this.banned);
            this.progress = 1;
            this.syncRoom();
        }
        /** Mark game as over. */
        over() {
            this.progress = 2;
            this.syncRoom();
        }
        /** Execute stages. */
        async loop() {
            if (this.#paused) {
                this.#paused = false;
                while (this.progress !== 2 && await this.rootStage.next())
                    ;
                this.#paused = true;
            }
        }
        /** Load mode. */
        async #loadMode(mode) {
            // Get list of packages that define game classes
            let pack = mode;
            while (pack) {
                if (this.#ruleset.includes(pack)) {
                    break;
                }
                this.#ruleset.unshift(pack);
                pack = (await importExtension(pack)).mode?.inherit;
            }
            // merge mode objects and game classes from extensions
            const modeTasks = [];
            for (const pack of this.#ruleset) {
                const mode = copy(getExtension(pack)?.mode ?? {});
                for (const name in mode.classes) {
                    const cls = this.#gameClasses.get(name);
                    this.#gameClasses.set(name, mode.classes[name](cls));
                }
                modeTasks.push(mode.tasks);
                apply(this.mode, mode);
            }
            // update task classes
            for (const tasks of modeTasks) {
                for (const task in tasks) {
                    const cls = this.#taskClasses.get(task) ?? this.getClass('task');
                    this.#taskClasses.set(task, tasks[task](cls));
                }
            }
            // finalize and freez mode object
            delete this.mode.game;
            delete this.mode.tasks;
            delete this.mode.components;
            this.mode.extension = mode;
            freeze(this.mode);
            // start game
            globals.accessor = new (this.getClass('game'))(this, globals.worker);
            this.rootStage = this.currentStage = this.createStage('main');
            const arena = this.arena = this.create('arena');
            arena.ruleset = this.#ruleset;
            this.loop();
        }
    }

    const version = '2.0.0dev1';

    /**
     * Manager of component syncing between client and server.
     */
    class Worker {
        /** Worker version. */
        version = version;
        /** User identifier. */
        uid;
        /** User nickname and avatar. */
        info;
        /** Connected hub. */
        connection = null;
        /** Links of connected clients. */
        peers = null;
        /** Ticked history items with timestamp. */
        #history = [];
        /** Entries to be ticked. */
        #ticks = [];
        /**
         * Setup communication.
         */
        constructor() {
            self.onmessage = ({ data }) => {
                if (data[1] === 0) {
                    self.onmessage = ({ data }) => this.#dispatch(data);
                    this.uid = data[0];
                    globals.game.init(data[3]);
                }
            };
            self.postMessage('ready');
        }
        /** Send a message to all clients. */
        broadcast(tick) {
            if (this.peers) {
                // broadcast tick
                this.connection.send('bcast:' + JSON.stringify(tick));
            }
            self.postMessage(tick);
        }
        /** Send a message to a client. */
        send(uid, tick) {
            if (uid === this.uid) {
                self.postMessage(tick);
            }
            else if (this.peers) {
                // send tick to a remote client
                this.connection.send('to:' + JSON.stringify([
                    uid, JSON.stringify(tick)
                ]));
            }
        }
        /** Connect to remote hub. */
        connect(url) {
            if (this.connection) {
                return;
            }
            const ws = this.connection = new WebSocket('wss://' + url);
            ws.onerror = ws.onclose = () => {
                if (this.connection === ws) {
                    this.connection = null;
                    if (this.peers) {
                        for (const peer of this.peers.values()) {
                            peer.unlink();
                        }
                    }
                    this.peers = null;
                    this.sync();
                }
            };
            ws.onopen = () => {
                ws.send('init:' + JSON.stringify([this.uid, this.info, globals.game.syncRoom(false)]));
            };
            ws.onmessage = ({ data }) => {
                try {
                    const [method, arg] = split(data);
                    this[method](arg);
                }
                catch (e) {
                    console.log(e, data);
                }
            };
        }
        /** Disconnect from remote hub. */
        disconnect() {
            const ws = this.connection;
            if (ws) {
                ws.send('edit:close');
                setTimeout(() => {
                    if (ws === this.connection) {
                        ws.close();
                    }
                }, 1000);
            }
        }
        /** Tell registered components about client update. */
        sync() {
            let peers = null;
            if (this.peers) {
                peers = [];
                for (const peer of this.peers.values()) {
                    peers.push(peer.id);
                }
            }
            globals.game.arena.update({ peers });
        }
        /** The room is ready for clients to join. */
        ready() {
            this.peers = new Map();
            this.createPeer(this.uid, this.info);
        }
        /** A remote client joins the room. */
        join(msg) {
            // join as player or spectator
            const [uid, info] = JSON.parse(msg);
            this.createPeer(uid, info);
            globals.game.syncRoom();
            this.send(uid, globals.game.pack());
        }
        /** A remote client leaves the room. */
        leave(uid) {
            if (this.peers?.has(uid)) {
                this.peers.get(uid).unlink();
                this.peers.delete(uid);
                this.sync();
                globals.game.syncRoom();
            }
        }
        /** A remote client sends a response message. */
        resp(msg) {
            this.#dispatch(JSON.parse(msg));
        }
        /** Create a peer component. */
        createPeer(uid, info) {
            const peer = globals.game.create('peer');
            peer.update({
                owner: uid,
                nickname: info[0],
                avatar: info[1],
                playing: this.getPeers({ playing: true }).length < globals.game.config.np
            });
            this.peers.set(uid, peer);
            this.sync();
        }
        /** Get peers that match certain condition. */
        getPeers(filter) {
            if (!this.peers) {
                return null;
            }
            const peers = [];
            for (const peer of this.peers.values()) {
                let skip = false;
                for (const key in filter) {
                    if (peer[key] !== filter[key]) {
                        skip = true;
                        continue;
                    }
                }
                if (!skip) {
                    peers.push(peer);
                }
            }
            return peers;
        }
        /** Add component update (called by Link). */
        tick(id, item) {
            if (this.#ticks.length === 0) {
                // schedule a UITick if no pending UITick exists
                setTimeout(() => this.#commit());
            }
            this.#ticks.push([globals.game.currentStage.id, id, item]);
        }
        /** Generate UITick(s) from this.#ticks. */
        #commit() {
            // split UITick by stage change
            const stages = [];
            const now = Date.now();
            for (const entry of this.#ticks) {
                if (stages.length === 0 || stages[stages.length - 1][0] !== entry[0]) {
                    stages.push([entry[0], []]);
                }
                stages[stages.length - 1][1].push(entry);
            }
            // generate UITick(s)
            for (const [stageID, entries] of stages) {
                const tagChanges = {};
                const propChanges = {};
                const calls = {};
                // merge updates from different ticks
                for (const [, id, item] of entries) {
                    if (Array.isArray(item)) {
                        calls[id] ??= [];
                        calls[id].push(item);
                    }
                    else if (item && typeof item === 'object') {
                        propChanges[id] ??= {};
                        Object.assign(propChanges[id], item);
                    }
                    else {
                        tagChanges[id] = item;
                    }
                }
                // sync and save UITick
                const tick = [stageID, tagChanges, propChanges, calls];
                this.broadcast(tick);
                this.#history.push([now, tick]);
            }
            this.#ticks.length = 0;
        }
        /** Dispatch message from client. */
        async #dispatch(data) {
            try {
                const [uid, sid, id, result, done] = data;
                const stage = globals.game.currentStage;
                const link = globals.game.links.get(id);
                if (id === -1) {
                    // reload UI upon error
                    this.send(uid, globals.game.pack());
                }
                else if (id === -2) {
                    // disconnect from remote hub
                    this.disconnect();
                }
                else if (sid === stage.id && link && link[1].owner === uid) {
                    // send result to listener
                    if (done && stage.awaits.has(id)) {
                        // results: component.respond() -> link.await()
                        const key = stage.awaits.get(id);
                        if (key) {
                            stage.results[key] = result;
                        }
                        stage.awaits.delete(id);
                        if (!stage.awaits.size) {
                            globals.game.loop();
                        }
                    }
                    else if (!done && stage.monitors.has(id)) {
                        // results: component.yield() -> link.monitor()
                        const method = stage.monitors.get(id);
                        stage.task[method](result, link[0]);
                    }
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    }

    globals.worker = new Worker();
    globals.game = new Game();

}());
