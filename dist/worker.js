(function () {
    'use strict';

    const version = '2.0.0dev1';

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
        /** Child task triggered by before or after event. */
        trigger = 'trigger';
        /** Main task. */
        tasks;
        /** Child steps of task objects.
         * Stage: child stage
         * array: [function name, executed, function arguments]
         * Dict:
         */
        steps = new Map();
        /** Parent stage. */
        parent = null;
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
        monitors = new Map();
        /** Awaiting values from component.return(). */
        awaits = new Map();
        /** Values from component.return(). */
        results = {};
        /** Reference to game object. */
        #game;
        /** Get task based on current progress. */
        get task() {
            if (this.progress >= 0) {
                return this.tasks[Math.floor(this.progress / 2)] ?? null;
            }
            return null;
        }
        constructor(id, path, data, game) {
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
        async next() {
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
                const steps = this.steps.get(task);
                for (const step of steps) {
                    if (Array.isArray(step)) {
                        // call a task method
                        if (step[1] === false) {
                            try {
                                await task[step[0]](...step[2]);
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

    class Task {
        /** Game stage that task belongs to. */
        #stage;
        /** Accessor of game objects. */
        #game;
        get game() {
            return this.#game.accessor;
        }
        constructor(stage, game) {
            this.#stage = stage;
            this.#game = game;
            stage.steps.set(this, []);
        }
        /** Main function. */
        main() { }
        /** Create a link. */
        create(tag) {
            return this.#game.create(tag);
        }
        /** Add a step in current stage. */
        add(step, ...args) {
            this.#stage.steps.get(this).push([step, false, args]);
        }
        /** Add a child stage in current stage. */
        addTask(path, data) {
            const stage = this.#game.createStage(path, data);
            stage.parent = this.#stage;
            this.#stage.steps.get(this).push(stage);
            return stage.tasks[1];
        }
        /** Add a sibline stage next to current stage. */
        addSiblingTask(path, data) {
            const stage = this.#game.createStage(path, data);
            stage.parent = this.#stage.parent;
            for (const steps of this.#stage.parent.steps.values()) {
                const idx = steps.indexOf(this.#stage.parent);
                if (idx !== -1) {
                    steps.splice(idx + 1, 0, stage);
                    return stage.tasks[1];
                }
            }
            throw ('failed to add sibling ' + path);
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
                this.#stage.progress = 4;
                this.#stage.skipped = true;
                this.#stage.awaits.clear();
                this.#stage.monitors.clear();
                return true;
            }
            return false;
        }
        /** Force stage to finish (without triggering skip event). */
        cancel() {
            if (this.#stage.progress < 2) {
                this.#stage.progress = -1;
                this.#stage.skipped = true;
                this.#stage.awaits.clear();
                this.#stage.monitors.clear();
                return true;
            }
            return false;
        }
    }

    /** Accessor of game and worker properties and methods. */
    class Accessor {
        /** Original game object. */
        #game;
        /** Original worker object. */
        #worker;
        get owner() {
            return this.#worker.uid;
        }
        get mode() {
            return this.#game.mode;
        }
        get config() {
            return this.#game.config;
        }
        get packs() {
            return this.#game.packs;
        }
        get banned() {
            return this.#game.banned;
        }
        get playerLinks() {
            return this.#worker.getPeers({ playing: true });
        }
        get spectatorLinks() {
            return this.#worker.getPeers({ playing: false });
        }
        constructor(game, worker) {
            this.#game = game;
            this.#worker = worker;
        }
        /** Connect to remote hub. */
        connect(url) {
            this.#worker.connect(url);
        }
        /** Disconnect from remote hub. */
        disconnect() {
            this.#worker.disconnect();
        }
        /** Access extension content. */
        getExtension(path) {
            return this.#game.getExtension(path);
        }
        /** Get links to peers. */
        getPeers(filter) {
            return this.#worker.getPeers(filter);
        }
        /** Send room info to hub. */
        syncRoom() {
            this.#game.syncRoom();
        }
        /** Mark game as started. */
        start() {
            this.#game.start();
        }
        /** Mark game as over. */
        over() {
            this.#game.over();
        }
    }

    class Game {
        /** Root game stage. */
        rootStage;
        /** Current game stage. */
        currentStage;
        /** Links to components. */
        links = new Map();
        /** Game mode. */
        mode;
        /** Game configuration. */
        config;
        /** Game data. */
        data = {};
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
        /** Currently paused by stage.awaits. */
        paused = true;
        /** Property and method accessor. */
        accessor;
        /** Worker reference. */
        #worker;
        /** All created stages. */
        #stages = new Map();
        /** Loaded extensions. */
        #extensions = new Map();
        /** Array of packages that define mode tasks (priority: high -> low). */
        #ruleset = [];
        /** Map of task classes. */
        #taskClasses = new Map();
        /** Number of links created. */
        #linkCount = 0;
        /** Number of stages created. */
        #stageCount = 0;
        constructor(content, worker) {
            this.#worker = worker;
            this.mode = {};
            this.packs = new Set(content[1]);
            this.banned.heropacks = new Set(content[2]);
            this.banned.cardpacks = new Set(content[3]);
            this.config = content[4];
            this.#worker.info = content[5];
            this.accessor = new Accessor(this, worker);
            // load extensions
            const load = async (pack) => {
                const ext = freeze((await import(`../extensions/${pack}/main.js`)).default);
                this.#extensions.set(pack, ext);
            };
            Promise.all(content[1].map(load)).then(async () => {
                // index packages that define mode tasks
                let mode = content[0];
                while (mode) {
                    if (this.#ruleset.includes(mode)) {
                        break;
                    }
                    if (!this.#extensions.has(mode)) {
                        await load(mode);
                    }
                    this.#ruleset.unshift(mode);
                    mode = this.#extensions.get(mode).mode?.inherit;
                }
                // merge mode objects from extensions and create task constructors
                for (const name of this.#ruleset) {
                    const mode = copy(this.#extensions.get(name)?.mode ?? {});
                    for (const task in mode.tasks) {
                        const cls = this.#taskClasses.get(task) ?? Task;
                        this.#taskClasses.set(task, mode.tasks[task](cls));
                    }
                    apply(this.mode, mode);
                }
                // delete useless properties
                delete this.mode.tasks;
                delete this.mode.components;
                this.mode.extension = content[0];
                // start game
                this.rootStage = this.currentStage = this.createStage('main');
                this.arena = this.create('arena');
                this.loop();
            });
        }
        /** Create a link. */
        create(tag) {
            const id = ++this.#linkCount;
            const obj = {};
            // reserved link keys
            const reserved = {
                id, tag,
                call: (method, arg) => {
                    this.#worker.tick(id, [method, arg]);
                },
                unlink: () => {
                    this.#worker.tick(id, null);
                },
                update: (items) => {
                    for (const key in items) {
                        const val = items[key] ?? null;
                        val === null ? delete obj[key] : obj[key] = val;
                    }
                    this.#worker.tick(id, items);
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
            this.#worker.tick(id, tag);
            return link;
        }
        /** Create a stage. */
        createStage(path, data) {
            const id = ++this.#stageCount;
            const stage = new Stage(id, path, data ?? {}, this);
            this.#stages.set(id, stage);
            return stage;
        }
        /** Access extension content. */
        getExtension(path) {
            const [ext, keys] = path.split(':');
            return access(this.#extensions.get(ext), keys) ?? null;
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
        /** Update room info for idle clients. */
        syncRoom(push = true) {
            const room = JSON.stringify([
                // mode name
                this.mode.name,
                // joined players
                this.#worker.getPeers({ playing: true })?.length ?? 1,
                // number of players in a game
                this.config.np,
                // nickname and avatar of owner
                this.#worker.info,
                // game state
                this.progress
            ]);
            if (push) {
                this.#worker.connection?.send('edit:' + room);
            }
            return room;
        }
        /** Backup game progress. */
        backup() {
            //////
            return new Promise(resolve => {
                resolve();
            });
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
            if (this.paused) {
                this.paused = false;
                while (this.progress !== 2 && await this.rootStage.next())
                    ;
                this.paused = true;
            }
        }
    }

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
        /** Game object. */
        #game;
        /**
         * Setup communication.
         */
        constructor() {
            self.onmessage = ({ data }) => {
                if (data[1] === 0) {
                    self.onmessage = ({ data }) => this.#dispatch(data);
                    this.uid = data[0];
                    this.#game = new Game(data[3], this);
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
                ws.send('init:' + JSON.stringify([this.uid, this.info, this.#game.syncRoom(false)]));
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
            this.#game.arena.update({ peers });
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
            this.#game.syncRoom();
            this.send(uid, this.#game.pack());
        }
        /** A remote client leaves the room. */
        leave(uid) {
            if (this.peers?.has(uid)) {
                this.peers.get(uid).unlink();
                this.peers.delete(uid);
                this.sync();
                this.#game.syncRoom();
            }
        }
        /** A remote client sends a response message. */
        resp(msg) {
            this.#dispatch(JSON.parse(msg));
        }
        /** Create a peer component. */
        createPeer(uid, info) {
            const peer = this.#game.create('peer');
            peer.update({
                owner: uid,
                nickname: info[0],
                avatar: info[1],
                playing: this.getPeers({ playing: true }).length < this.#game.config.np
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
            this.#ticks.push([this.#game.currentStage.id, id, item]);
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
                const stage = this.#game.currentStage;
                const link = this.#game.links.get(id);
                if (id < 0) {
                    // reload UI upon error
                    this.send(uid, this.#game.pack());
                }
                else if (sid === stage.id && link && link[1].owner === uid) {
                    // send result to listener
                    if (done && stage.awaits.has(id)) {
                        // results: component.return() -> link.await()
                        const key = stage.awaits.get(id);
                        if (key) {
                            stage.results[key] = result;
                        }
                        stage.awaits.delete(id);
                        if (!stage.awaits.size && this.#game.paused) {
                            this.#game.loop();
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

    const worker = new Worker();
    globalThis.worker = worker;

}());
