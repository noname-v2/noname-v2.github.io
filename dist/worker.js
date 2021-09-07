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
    function apply(to, from, exclude) {
        for (const key in from) {
            if (exclude?.includes(key)) {
                continue;
            }
            else if (to[key]?.constructor === Object && from[key]?.constructor === Object) {
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
    /** Return a promise that resolves after n seconds. */
    function sleep(n) {
        return new Promise(resolve => setTimeout(resolve, n * 1000));
    }
    /** Generate a unique string based on current Date.now().
     * Mapping: Date.now(): [0-9] -> [0-62] -> [A-Z] | [a-z] | [0-9]
     */
    function rng() {
        return new Date().getTime().toString().split('').map(n => {
            const c = Math.floor((parseInt(n) + Math.random()) * 6.2);
            return String.fromCharCode(c < 26 ? c + 65 : (c < 52 ? c + 71 : c - 4));
        }).join('');
    }
    /** Fetch and parse json file. */
    function readJSON(...args) {
        return new Promise(resolve => {
            fetch(args.join('/')).then(response => {
                response.json().then(resolve);
            });
        });
    }
    /** Randomly get an item from an array. */
    function rget(iterable) {
        const arr = Array.from(iterable);
        return arr[Math.floor(Math.random() * arr.length)];
    }
    /** Randomly get items from an array. */
    function rgets(iterable, n = 1, inplace = false) {
        let set;
        if (inplace && iterable instanceof Set) {
            set = iterable;
        }
        else {
            set = new Set(iterable);
        }
        const setChosen = new Set();
        for (let i = 0; i < n; i++) {
            if (!set.size) {
                break;
            }
            const item = rget(set);
            set.delete(item);
            setChosen.add(item);
        }
        return setChosen;
    }

    var utils = /*#__PURE__*/Object.freeze({
        __proto__: null,
        copy: copy,
        apply: apply,
        freeze: freeze,
        access: access,
        split: split,
        sleep: sleep,
        rng: rng,
        readJSON: readJSON,
        rget: rget,
        rgets: rgets
    });

    /** Enable debug mode in http */
    const debug = globalThis.location.protocol === 'http:';

    let room;
    let hub;
    let connection = null;
    function set(target, val) {
        switch (target) {
            case 'room':
                room = val;
                break;
            case 'hub':
                hub = val;
                break;
            case 'connection':
                connection = val;
                break;
        }
        if (debug) {
            self[target] = val;
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
        results = new Map();
        constructor(id, path, data, parent) {
            this.id = id;
            this.path = path;
            this.parent = parent;
            this.task = apply(new (room.getTask(path))(), data);
            room.taskMap.set(this.task, this);
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
            room.currentStage = this;
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
            const stage = room.createStage('trigger', { event }, this);
            stage.task.silent = true;
            this.steps.push(stage);
        }
    }

    class Task {
        /** Do not trigger before / after / skip event. */
        silent = false;
        /** Map containing custom results. */
        results = new Map();
        get game() {
            return room.game;
        }
        get path() {
            return this.#stage.path;
        }
        get parent() {
            return this.#stage.parent?.task ?? null;
        }
        get #stage() {
            return room.taskMap.get(this);
        }
        /** Main function. */
        main() { }
        /** Add a step in current stage. */
        add(step, ...args) {
            this.#stage.steps.push([step, false, args]);
        }
        /** Add a child stage in current stage. */
        addTask(path, data) {
            const stage = room.createStage(path, data, this.#stage);
            this.#stage.steps.push(stage);
            return stage.task;
        }
        /** Add a sibline stage next to current stage. */
        addSiblingTask(path, data) {
            const stage = room.createStage(path, data, this.#stage.parent);
            const idx = this.#stage.steps.indexOf(this.#stage.parent);
            if (idx !== -1) {
                this.#stage.steps.splice(idx + 1, 0, stage);
                return stage.task;
            }
            throw ('failed to add sibling to ' + path);
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
            this.#stage.trigger(name);
        }
        /** Delay for a given time. */
        async sleep(duration = 1) {
            await this.game.utils.sleep(duration * (this.game.config.speed ?? 0.3));
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
    /** Access extension content. */
    function accessExtension(path, ...paths) {
        if (paths.length) {
            if (!path.includes(':')) {
                path += ':';
            }
            else {
                path += '.';
            }
            path += paths.join('.');
        }
        const [ext, keys] = path.split(':');
        return access(extensions.get(ext), keys) ?? null;
    }
    /** Get hero info. */
    function getHero(id) {
        const [ext, name] = split(id);
        return accessExtension(ext, 'hero', name);
    }
    /** Get card info. */
    function getCard(id) {
        const [ext, name] = split(id);
        return accessExtension(ext, 'card', name);
    }

    /** Game object used by stages. */
    class Game {
        /** Game mode. */
        mode;
        /** Game configuration. */
        config = {};
        /** Hero packages. */
        packs;
        get owner() {
            return room.uid;
        }
        get arena() {
            return room.arena;
        }
        get hub() {
            return hub;
        }
        get utils() {
            return utils;
        }
        get accessExtension() {
            return accessExtension;
        }
        get getHero() {
            return getHero;
        }
        get getCard() {
            return getCard;
        }
        /** Get a link. */
        get(id) {
            return room.links.get(id);
        }
        /** Create a link. */
        create(tag) {
            return room.create(tag);
        }
        /** Creata a class in game.#gameClasses. */
        createInstance(name, ...args) {
            return new (room.getClass(name))(...args);
        }
        /** Mark game as started and disallow changing configuration. */
        start() {
            freeze(this.config);
            room.progress = 1;
            hub.update();
        }
        /** Mark game as over. */
        over() {
            room.progress = 2;
            hub.update();
        }
    }

    /** Entries to be ticked. */
    const ticks = [];
    /** Send a message to a client. */
    function send(to, tick) {
        if (to === room.uid) {
            self.postMessage(tick);
        }
        else if (hub.connected) {
            // send tick to a remote client
            connection.send('to:' + JSON.stringify([
                to, JSON.stringify(tick)
            ]));
        }
    }
    /** Send a message to all clients. */
    function broadcast(tick) {
        if (hub.connected) {
            connection.send('bcast:' + JSON.stringify(tick));
        }
        self.postMessage(tick);
    }
    /** Add component update (called by Link). */
    function tick(id, item) {
        if (ticks.length === 0) {
            // schedule a UITick if no pending UITick exists
            setTimeout(() => commit());
        }
        ticks.push([room.currentStage.id, id, item]);
    }
    /** Generate UITick(s) from this.#ticks. */
    function commit() {
        // split UITick by stage change
        const stages = [];
        for (const entry of ticks) {
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
            broadcast(tick);
        }
        ticks.length = 0;
    }
    /** Dispatch message from client. */
    async function dispatch(data) {
        try {
            const [uid, sid, id, result, done] = data;
            const stage = room.currentStage;
            const link = room.links.get(id);
            if (id === -1) {
                // reload UI upon error
                send(uid, room.pack());
            }
            else if (id === -2) {
                // disconnect from remote hub
                hub.disconnect();
            }
            else if (sid === stage.id && link && link[1].owner === uid) {
                // send result to listener
                if (done && stage.awaits.has(id)) {
                    // results: component.respond() -> link.await()
                    if (result === null || result === undefined) {
                        stage.results.delete(id);
                    }
                    else {
                        stage.results.set(id, result);
                    }
                    stage.awaits.delete(id);
                    if (!stage.awaits.size) {
                        room.loop();
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

    function createLink(id, tag) {
        const obj = {};
        // reserved link keys
        const reserved = {
            id, tag,
            call(method, arg) {
                tick(id, [method, arg]);
            },
            unlink() {
                tick(id, null);
                room.links.delete(id);
            },
            update(items) {
                for (const key in items) {
                    const val = items[key] ?? null;
                    val === null ? delete obj[key] : obj[key] = val;
                }
                tick(id, items);
            },
            monitor(callback) {
                room.currentStage.monitors.set(link.id, callback);
            },
            await(timeout) {
                const stage = room.currentStage;
                stage.awaits.set(link.id, timeout || null);
                if (timeout) {
                    setTimeout(() => {
                        if (stage === room.currentStage && stage.awaits.has(id)) {
                            stage.results.delete(id);
                            stage.awaits.delete(id);
                            if (!stage.awaits.size) {
                                room.loop();
                            }
                        }
                    }, timeout * 1000);
                }
            },
            result() {
                return room.currentStage.results.get(link.id) ?? null;
            }
        };
        const link = new Proxy(obj, {
            get(_, key) {
                if (key in reserved) {
                    if (key === 'result') {
                        return reserved[key]() ?? null;
                    }
                    else {
                        return reserved[key];
                    }
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
        tick(id, tag);
        room.links.set(id, [link, obj]);
        return link;
    }

    /** Room that controls game flow and classes. */
    class Room {
        /** Owner ID. */
        uid;
        /** Owner nickname and avatar. */
        info;
        /** Root game stage. */
        rootStage;
        /** Current game stage. */
        currentStage;
        /** Link to Arena. */
        arena;
        /** Game object. */
        game;
        /** Game progress.
         * 0: waiting
         * 1: gaming
         * 2: over
        */
        progress = 0;
        /** Links to components. */
        links = new Map();
        /** Map from a task to the stage containing the task. */
        taskMap = new Map();
        /** All created stages. */
        #stages = new Map();
        /** Array of packages that define mode tasks (priority: high -> low). */
        #ruleset = [];
        /** Map of task classes. */
        #taskClasses = new Map();
        /** Base game classes. */
        #gameClasses = new Map([['game', Game], ['task', Task]]);
        /** Number of links created. */
        #linkCount = 0;
        /** Number of stages created. */
        #stageCount = 0;
        /** Currently paused by stage.awaits. */
        #paused = true;
        async init(uid, [name, packs, info]) {
            this.uid = uid;
            this.info = info;
            // load extensions
            await Promise.all(packs.map(pack => importExtension(pack)));
            // Get list of packages that define game classes
            await this.#getRuleset(name);
            // merge mode objects and game classes from extensions
            const mode = await this.#loadRuleset();
            // start game
            this.game = new (this.getClass('game'))();
            this.game.mode = mode;
            this.game.packs = new Set(packs);
            this.rootStage = this.currentStage = this.createStage('main');
            this.arena = this.game.create('arena');
            this.arena.ruleset = this.#ruleset;
            this.arena.packs = packs;
            this.arena.mode = mode.extension;
            this.loop();
        }
        /** Create a link. */
        create(tag) {
            const id = ++this.#linkCount;
            return createLink(id, tag);
        }
        /** Create a stage. */
        createStage(path, data, parent) {
            const id = ++this.#stageCount;
            const stage = new Stage(id, path, data ?? {}, parent ?? null);
            this.#stages.set(id, stage);
            return stage;
        }
        /** Get or create task constructor. */
        getTask(path) {
            if (!this.#taskClasses.has(path)) {
                // get task from extension sections
                const section = accessExtension(path);
                const cls = section.inherit ? this.getTask(section.inherit) : Task;
                this.#taskClasses.set(path, section.task(cls));
            }
            return this.#taskClasses.get(path);
        }
        /** Get a game class. */
        getClass(path) {
            return this.#gameClasses.get(path);
        }
        /** Get a UITick of all links. */
        pack() {
            const tags = {};
            const props = {};
            for (const [uid, [link, obj]] of this.links) {
                tags[uid] = link.tag;
                props[uid] = obj;
            }
            return [this.currentStage.id, tags, props, {}];
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
        /** Get and load all extensions relevant to current mode. */
        async #getRuleset(mode) {
            while (mode) {
                if (this.#ruleset.includes(mode)) {
                    break;
                }
                this.#ruleset.unshift(mode);
                mode = (await importExtension(mode)).mode?.inherit;
            }
        }
        /** Update extension-defined classes and game mode. */
        async #loadRuleset() {
            const mode = {};
            const modeTasks = [];
            const exclude = ['tasks', 'components', 'classes'];
            for (const pack of this.#ruleset) {
                const extMode = copy(accessExtension(pack)?.mode ?? {});
                // update game classes (including base Task class)
                for (const name in extMode.classes) {
                    const cls = this.#gameClasses.get(name);
                    this.#gameClasses.set(name, extMode.classes[name](cls));
                }
                // update task classes after Task class is finalized
                modeTasks.push(extMode.tasks);
                apply(mode, extMode, exclude);
            }
            // update task classes
            for (const tasks of modeTasks) {
                for (const task in tasks) {
                    const cls = this.#taskClasses.get(task) ?? this.getClass('task');
                    const constructor = tasks[task](cls);
                    if (typeof constructor === 'function') {
                        this.#taskClasses.set(task, constructor);
                    }
                    else {
                        for (const name in constructor) {
                            this.#taskClasses.set(name, constructor[name]);
                        }
                    }
                }
            }
            // save mode extension name
            mode.extension = this.#ruleset[this.#ruleset.length - 1];
            return freeze(mode);
        }
    }

    /** Hub related operations. */
    class Hub {
        /** IDs and links of connected clients. */
        #peers = null;
        get peers() {
            return this.#getPeers();
        }
        get players() {
            return this.#getPeers({ playing: true });
        }
        get spectators() {
            return this.#getPeers({ playing: false });
        }
        get connected() {
            return this.#peers ? true : false;
        }
        /** Connect to remote hub. */
        connect(url) {
            if (connection) {
                return;
            }
            const ws = new WebSocket('wss://' + url);
            set('connection', ws);
            // connection closed
            ws.onerror = ws.onclose = () => {
                if (connection === ws) {
                    set('connection', null);
                    if (this.#peers) {
                        for (const peer of this.#peers.values()) {
                            peer.unlink();
                        }
                    }
                    this.#peers = null;
                    this.#sync();
                }
            };
            // send room info to hub
            ws.onopen = () => {
                ws.send('init:' + JSON.stringify([
                    room.uid, room.info, this.update(false)
                ]));
            };
            // handle messages
            ws.onmessage = ({ data }) => {
                try {
                    const [method, arg] = split(data);
                    switch (method) {
                        case 'ready':
                            this.#ready();
                            break;
                        case 'join':
                            this.#join(arg);
                            break;
                        case 'leave':
                            this.#leave(arg);
                            break;
                        case 'resp':
                            this.#resp(arg);
                            break;
                    }
                }
                catch (e) {
                    console.log(e, data);
                }
            };
        }
        /** Disconnect from remote hub. */
        disconnect() {
            const ws = connection;
            if (ws) {
                ws.send('edit:close');
                setTimeout(() => {
                    if (ws === connection) {
                        ws.close();
                    }
                }, 1000);
            }
        }
        /** Update room info for idle clients. */
        update(push = true) {
            const state = JSON.stringify([
                // mode name
                room.game.mode.name,
                // joined players
                this.players?.length ?? 1,
                // number of players in a game
                room.game.config.np,
                // nickname and avatar of owner
                room.info,
                // game state
                room.progress
            ]);
            if (push) {
                connection?.send('edit:' + state);
            }
            return state;
        }
        /** The room is ready for clients to join. */
        #ready() {
            this.#peers = new Map();
            this.#createPeer(room.uid, room.info);
        }
        /** A remote client joins the room. */
        #join(msg) {
            // join as player or spectator
            const [uid, info] = JSON.parse(msg);
            this.#createPeer(uid, info);
            this.update();
            send(uid, room.pack());
        }
        /** A remote client leaves the room. */
        #leave(uid) {
            if (this.#peers?.has(uid)) {
                this.#peers.get(uid).unlink();
                this.#peers.delete(uid);
                this.#sync();
                this.update();
            }
        }
        /** A remote client sends a response message. */
        #resp(msg) {
            dispatch(JSON.parse(msg));
        }
        /** Tell registered components about client update. */
        #sync() {
            let ids = null;
            if (this.#peers) {
                ids = [];
                for (const peer of this.#peers.values()) {
                    ids.push(peer.id);
                }
            }
            room.arena.peers = ids;
        }
        /** Get peers that match certain condition. */
        #getPeers(filter) {
            if (!this.#peers) {
                return null;
            }
            const links = [];
            for (const peer of this.#peers.values()) {
                let skip = false;
                for (const key in filter) {
                    if (peer[key] !== filter[key]) {
                        skip = true;
                        continue;
                    }
                }
                if (!skip) {
                    links.push(peer);
                }
            }
            return links;
        }
        /** Create a peer component. */
        #createPeer(uid, info) {
            const peer = room.create('peer');
            peer.update({
                owner: uid,
                nickname: info[0],
                avatar: info[1],
                playing: this.players.length < room.game.config.np
            });
            this.#peers.set(uid, peer);
            this.#sync();
        }
    }

    self.onmessage = ({ data }) => {
        if (data[1] === 0) {
            self.onmessage = ({ data }) => dispatch(data);
            set('hub', new Hub());
            set('room', new Room());
            room.init(data[0], data[3]);
        }
    };
    self.postMessage('ready');

}());
