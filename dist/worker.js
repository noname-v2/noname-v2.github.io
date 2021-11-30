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

    const taskClasses$1 = new Map();
    const linkClasses$1 = new Map();
    let room;
    /** Initial configurations from client. */
    let uid;
    let info;
    /** Initialize uid, nickname and avatar. */
    function init(u, i) {
        uid = u;
        info = i;
    }
    /** Set current room. */
    function setRoom(r) {
        room = r;
        if (debug) {
            self.room = r;
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
            this.task = apply(new (room.getTask(path))(id), data);
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

    /** WebSocket connection. */
    let connection = null;
    /** IDs and links of connected clients. */
    let peers = null;
    /** Handler of messages received. */
    const messages = {
        /** The room is ready for clients to join. */
        ready() {
            peers = new Map();
            createPeer(uid, info);
        },
        /** A remote client joins the room. */
        join(msg) {
            // join as player or spectator
            const [uid, info] = JSON.parse(msg);
            createPeer(uid, info);
            update();
            send(uid, room.pack());
        },
        /** A remote client leaves the room. */
        leave(uid) {
            if (peers?.has(uid)) {
                peers.get(uid).unlink();
                peers.delete(uid);
                sync();
                update();
            }
        },
        /** A remote client sends a response message. */
        resp(msg) {
            dispatch(JSON.parse(msg));
        }
    };
    /** Connect to remote hub. */
    function connect(url) {
        if (connection) {
            return;
        }
        const ws = connection = new WebSocket('wss://' + url);
        // connection closed
        ws.onerror = ws.onclose = () => {
            if (connection === ws) {
                connection = null;
                if (peers) {
                    for (const peer of peers.values()) {
                        peer.unlink();
                    }
                }
                peers = null;
                sync();
            }
        };
        // send room info to hub
        ws.onopen = () => {
            ws.send('init:' + JSON.stringify([uid, info, update(false)]));
        };
        // handle messages
        ws.onmessage = ({ data }) => {
            try {
                const [method, arg] = split(data);
                messages[method](arg);
            }
            catch (e) {
                console.log(e, data);
            }
        };
    }
    /** Push peer changes to clients. */
    function sync() {
        let ids = null;
        if (peers) {
            ids = [];
            for (const peer of peers.values()) {
                ids.push(peer.id);
            }
        }
        room.arena.data.peers = ids;
    }
    /** Disconnect from remote hub. */
    function disconnect() {
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
    /** Send a message to a client. */
    function send(to, tick) {
        if (to === uid) {
            self.postMessage(tick);
        }
        else if (peers) {
            // send tick to a remote client
            connection.send('to:' + JSON.stringify([
                to, JSON.stringify(tick)
            ]));
        }
    }
    /** Update room info for idle clients. */
    function update(push = true) {
        const state = JSON.stringify([
            // mode name
            room.arena.mode.name,
            // joined players
            getPeers({ playing: true })?.length ?? 1,
            // number of players in a game
            room.arena.config.np,
            // nickname and avatar of owner
            info,
            // game state
            room.progress
        ]);
        if (push) {
            connection?.send('edit:' + state);
        }
        return state;
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
                disconnect();
            }
            else if (sid === stage.id && link && link.owner === uid) {
                // send result to listener
                if (done && stage.awaits.has(id)) {
                    // results: component.respond() -> link.await()
                    link.respond(result);
                }
                else if (!done && stage.monitors.has(id)) {
                    // results: component.yield() -> link.monitor()
                    const method = stage.monitors.get(id);
                    stage.task[method](result, link);
                }
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    /** Create a peer component. */
    function createPeer(uid, info) {
        const peer = room.create('peer');
        peer.update({
            owner: uid,
            nickname: info[0],
            avatar: info[1],
            playing: getPeers({ playing: true }).length < room.arena.config.np
        });
        peers.set(uid, peer);
        sync();
    }
    /** Get peers that match certain condition. */
    function getPeers(filter) {
        if (!peers) {
            return null;
        }
        const links = [];
        for (const peer of peers.values()) {
            let skip = false;
            let key;
            for (key in filter) {
                if (peer.data[key] !== filter[key]) {
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

    /** Entries to be ticked. */
    const ticks = [];
    /** Send a message to all clients. */
    function broadcast(tick) {
        if (peers) {
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
        ticks.push([room.currentStage?.id ?? 0, id, item]);
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
                    const props = propChanges[id];
                    for (const key in item) {
                        if (key.startsWith('^')) {
                            const key2 = key.slice(1);
                            if (props[key2]?.constructor === Object) {
                                // merge patch with existing full update
                                apply(props[key2], item[key]);
                            }
                            else {
                                // merge patch with existing patch
                                delete props[key2];
                                props[key] ??= {};
                                apply(props[key], item[key]);
                            }
                        }
                        else {
                            // replace patch with full update
                            delete props['^' + key];
                            props[key] = item[key];
                        }
                    }
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

    /** Worker-side component controller. */
    class Link {
        /** Component ID. */
        #id;
        /** Component tag. */
        #tag;
        /** Component data proxy. */
        #data;
        /** Map containing component data. */
        #props = new Map();
        get id() {
            return this.#id;
        }
        get tag() {
            return this.#tag;
        }
        get data() {
            return this.#data;
        }
        /** Component owner. */
        get owner() {
            return this.#props.get('owner');
        }
        /** Return value from component.respond(). */
        get result() {
            return room.currentStage.results.get(this.id) ?? null;
        }
        constructor(id, tag) {
            this.#id = id;
            this.#tag = tag;
            this.#data = new Proxy({}, {
                get: (_, key) => {
                    return this.#props.get(key);
                },
                set: (_, key, val) => {
                    this.update({ [key]: val });
                    return true;
                }
            });
            tick(id, tag);
            room.links.set(id, this);
        }
        /** Update properties. */
        update(items) {
            for (const key in items) {
                const val = items[key] ?? null;
                if (val === null) {
                    this.#props.delete(key);
                }
                else {
                    this.#props.set(key, val);
                }
            }
            tick(this.id, items);
        }
        /** Remove reference to link from both client and worker. */
        unlink() {
            tick(this.id, null);
            room.links.delete(this.id);
        }
        /** Update partial property. */
        patch(key, diff) {
            if (!this.#props.has(key)) {
                this.#props.set(key, {});
            }
            room.arena.utils.apply(this.#props.get(key), diff);
            tick(this.id, { ['^' + key]: diff });
        }
        /** Call a client-side method of the link. */
        call(method, ...args) {
            tick(this.id, [method, args]);
        }
        /** Callback of client-side component.yield(). */
        monitor(callback) {
            room.currentStage.monitors.set(this.id, callback);
        }
        /** Callback of client-side component.respond(). */
        await(timeout) {
            const stage = room.currentStage;
            stage.awaits.set(this.id, timeout || null);
            if (timeout) {
                setTimeout(() => {
                    if (stage === room.currentStage && stage.awaits.has(this.id)) {
                        stage.results.delete(this.id);
                        stage.awaits.delete(this.id);
                        if (!stage.awaits.size) {
                            room.loop();
                        }
                    }
                }, timeout * 1000);
            }
        }
        /** Set the return value of link.await() (equivalent to component.await()). */
        respond(result) {
            const stage = room.currentStage;
            if (result === null || result === undefined) {
                stage.results.delete(this.id);
            }
            else {
                stage.results.set(this.id, result);
            }
            stage.awaits.delete(this.id);
            if (!stage.awaits.size) {
                console.log('>', result);
                room.loop();
            }
        }
        pack() {
            return Object.fromEntries(this.#props);
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

    /** Room that controls game flow and classes. */
    class Room {
        /** Root game stage. */
        rootStage;
        /** Current game stage. */
        currentStage;
        /** Link to Arena. */
        arena;
        /** Game progress.
         * 0: waiting
         * 1: gaming
         * 2: over
        */
        progress = 0;
        /** Links to components. */
        links = new Map();
        /** All created stages. */
        stages = new Map();
        /** Array of packages that define mode tasks (priority: high -> low). */
        #ruleset = [];
        /** Map of task classes. */
        #taskClasses;
        /** Base game classes. */
        #linkClasses;
        /** Number of links created. */
        #linkCount = 0;
        /** Number of stages created. */
        #stageCount = 0;
        /** Currently paused by stage.awaits. */
        #paused = true;
        async init(name, packs) {
            // initialize classes
            this.#linkClasses = new Map(linkClasses$1);
            this.#taskClasses = new Map(taskClasses$1);
            // load extensions
            await Promise.all(packs.map(pack => importExtension(pack)));
            // Get list of packages that define game classes
            await this.#getRuleset(name);
            // merge mode objects and game classes from extensions
            const mode = await this.#loadRuleset();
            // start game
            this.arena = this.create('arena');
            this.arena.mode = mode;
            this.arena.update({ packs, ruleset: this.#ruleset, mode: mode.extension });
            this.rootStage = this.currentStage = this.createStage('main');
            this.loop();
        }
        /** Create a link. */
        create(tag) {
            const id = ++this.#linkCount;
            const cls = this.#linkClasses.get(tag) ?? Link;
            return new cls(id, tag);
        }
        /** Create a stage. */
        createStage(path, data, parent) {
            const id = ++this.#stageCount;
            const stage = new Stage(id, path, data ?? {}, parent ?? null);
            this.stages.set(id, stage);
            return stage;
        }
        /** Get or create task constructor. */
        getTask(path) {
            if (!this.#taskClasses.has(path)) {
                // get task from extension sections
                const section = accessExtension(path);
                const cls = section.inherit ? this.getTask(section.inherit) : this.#linkClasses.get('task');
                this.#taskClasses.set(path, section.task(cls));
            }
            return this.#taskClasses.get(path);
        }
        /** Get a UITick of all links. */
        pack() {
            const tags = {};
            const props = {};
            for (const [uid, link] of this.links) {
                tags[uid] = link.tag;
                props[uid] = link.pack();
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
                    const cls = this.#linkClasses.get(name);
                    this.#linkClasses.set(name, extMode.classes[name](cls));
                }
                // update task classes after Task class is finalized
                modeTasks.push(extMode.tasks);
                apply(mode, extMode, exclude);
            }
            // update task classes
            for (const tasks of modeTasks) {
                for (const task in tasks) {
                    const cls = this.#taskClasses.get(task) ?? this.#taskClasses.get('task');
                    this.#taskClasses.set(task, tasks[task](cls));
                }
            }
            // save mode extension name
            mode.extension = this.#ruleset[this.#ruleset.length - 1];
            return freeze(mode);
        }
    }

    /** Base game execution step. */
    class Task {
        /** Stage ID. */
        #id;
        /** Do not trigger before / after / skip event. */
        silent = false;
        get id() {
            return this.#id;
        }
        get arena() {
            return room.arena;
        }
        get mode() {
            return room.arena.mode;
        }
        get path() {
            return this.#stage.path;
        }
        get parent() {
            return this.#stage.parent?.task ?? null;
        }
        get #stage() {
            return room.stages.get(this.id);
        }
        constructor(id) {
            this.#id = id;
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
            await this.arena.utils.sleep(duration * (this.arena.config.speed ?? 0.3));
        }
    }

    class Choose extends Task {
        /** Has time limit. */
        timeout = null;
        /** Allow not choosing. */
        forced = false;
        /** Selection configurations of players. */
        selects;
        main() {
            this.add('choose');
            this.add('clear');
        }
        /** Update player data. */
        choose() {
            for (const id of this.selects.keys()) {
                // initialize selection and timer
                const player = this.arena.getPlayer(id);
                const cs = this.initSelect(player);
                player.monitor('checkUpdate');
                player.await(cs.timer ? cs.timer[0] : null);
            }
        }
        /** Handle update from client.
         * @param {number} level - Level of selection.
         * @param {string} selected - Stringified IDs of selected items.
         * @param {boolean?} progress - Finish current level of selection.
         * @param {Player} player - Player link.
         */
        checkUpdate([level, selected, progress], player) {
            let cs = player.data.select;
            let csu = {};
            let select = this.selects.get(player.id);
            if (!select || !cs) {
                // illegal selection from client
                this.initSelect(player);
                return;
            }
            // go to current level of selection
            for (let i = 0; i < level; i++) {
                if (!select.next || !cs.next) {
                    this.initSelect(player);
                    return;
                }
                select = select.next;
                cs = cs.next;
                csu = csu.next = {};
            }
            // items that changed selection state
            csu.items = {};
            // make sure selected items are legal
            for (const sid of selected) {
                if (typeof cs.items[sid] !== 'number') {
                    // illegal selection from client
                    this.initSelect(player);
                    return;
                }
            }
            // update selected items
            for (const sid in cs.items) {
                if (cs.items[sid] !== -1) {
                    const stat = selected.includes(sid) ? 1 : 0;
                    if (stat !== cs.items[sid]) {
                        cs.items[sid] = csu.items[sid] = stat;
                    }
                }
            }
            // update selectable items
            if (Object.keys(csu.items).length) {
                const update = this.filterSelect(select, cs);
                if (Object.keys(update).length) {
                    for (const key in update) {
                        // @ts-ignore
                        csu[key] = update[key];
                    }
                }
            }
            else {
                delete csu.items;
            }
        }
        /** Create Selection from Select. */
        parseSelect(select) {
            // min and max number of selected items
            let num;
            let simple = true;
            if (typeof select.num === 'number') {
                num = [select.num, select.num];
            }
            else if (Array.isArray(select.num) && typeof select.num[1] === 'number') {
                num = select.num.slice(0);
            }
            else {
                if (Array.isArray(select.num)) {
                    // leave [number, string] for this.updateSelect()
                    simple = false;
                }
                num = [1, 1];
            }
            if (select.filter && this.arena.countArgs(select.filter) > 2) {
                simple = false;
            }
            const cs = { items: {}, num };
            if (simple) {
                cs.simple = true;
            }
            // filter items if filter is not dependent on selected items
            for (const id of select.items) {
                const sid = typeof id === 'number' ? '#' + id.toString() : id;
                if (simple && !this.arena.callTask(select.filter, id, select)) {
                    cs.items[sid] = -1;
                }
                else {
                    cs.items[sid] = 0;
                }
            }
            // time limit for the selection (create for the first selection only)
            if (!select.previous && this.arena.connected) {
                const timeout = this.timeout ?? this.arena.config.timeout;
                if (timeout) {
                    cs.timer = [timeout, Date.now()];
                }
            }
            // client-side auxiliary data
            if (select.hasOwnProperty('options')) {
                cs.options = select.options;
            }
            return cs;
        }
        /** Update selectable items. */
        filterSelect(select, cs) {
            const update = {};
            // update select.num
            if (Array.isArray(select.num) && typeof select.num[1] === 'string') {
                const num = this.arena.callTask(select.num, select);
                if (cs.num[1] !== num[0] || cs.num[1] !== num[1]) {
                    update.num = num;
                }
                cs.num = num;
            }
            // check whether items are selectable (only if filter function takes cs as argument)
            if (select.filter && this.arena.countArgs(select.filter) === 3) {
                for (const id of select.items) {
                    const sid = typeof id === 'number' ? '#' + id.toString() : id;
                    if (cs.items[sid] !== 1) {
                        const stat = this.arena.callTask(select.filter, id, select, cs) ? 0 : -1;
                        if (stat !== cs.items[sid]) {
                            cs.items[sid] = stat;
                            update.items ??= {};
                            update.items[sid] = stat;
                        }
                    }
                }
            }
            return update;
        }
        /** Set initial selection state. */
        initSelect(player) {
            const select = this.selects.get(player.id);
            const cs = this.parseSelect(select);
            if (!cs.simple) {
                this.filterSelect(select, cs);
            }
            player.data.select = cs;
            return cs;
        }
        /** Go to the next level ot select. */
        progressSelect() {
        }
        /** Clear the lastest select and go back to select.previous. */
        rewindSelect() {
        }
        // /** Get disabled items. */
        // filter(cs: Select) {
        //     if (!cs.filter) {
        //         return false;
        //     }
        //     let changed = false;
        //     const disabled = new Set(cs.disabled);
        //     const task = this.arena.getTask(cs.filter[0]) as any;
        //     cs.disabled = [];
        //     for (const id of cs.items) {
        //         if (!task[cs.filter[1]](id, cs)) {
        //             cs.disabled.push(id);
        //             if (!disabled.has(id)) {
        //                 changed = true;
        //             }
        //         }
        //     }
        //     return changed || disabled.size !== cs.disabled.length;
        // }
        // /** Get a list of selectable items. */
        // getSelectable(selected: Selected, sels: Dict<Select>): (string | number)[] {
        //     const selectable: (string | number)[] = [];
        //     for (const section in sels) {
        //         const filter = this.game.createFilter(section, selected, sels, this);
        //         try {
        //             for (const item of sels[section].items) {
        //                 if (filter(item)) {
        //                     selectable.push(item);
        //                 }
        //             }
        //         }
        //         catch {
        //             return [];
        //         }
        //     }
        //     return selectable;
        // }
        // /** Check if selected items are legal. */
        // checkSelection(selected: Selected, sels: Dict<Select>) {
        //     // fake selected items
        //     const current: Selected = {};
        //     for (const section in sels) {
        //         current[section] = [];
        //     }
        //     // get section order
        //     const order = Object.keys(sels);
        //     order.sort((a, b) => (sels[a].order - sels[b].order));
        //     for (const section of order) {
        //         // check number of selected items
        //         const n = selected[section].length;
        //         const cs = sels[section];
        //         if (typeof cs.num === 'number') {
        //             if (n !== cs.num) {
        //                 return false;
        //             }
        //         }
        //         else if (Array.isArray(cs.num)) {
        //             if (n < cs.num[0] || n > cs.num[1]) {
        //                 return false;
        //             }
        //         }
        //         // check if selected items satisfy filter
        //         const filter = this.game.createFilter(section, current, sels, this);
        //         for (const item of selected[section]) {
        //             if (!filter(item)) {
        //                 return false;
        //             }
        //             current[section].push(item);
        //         }
        //     }
        //     return true;
        // }
        clear() {
            for (const id of this.selects.keys()) {
                this.arena.getPlayer(id).data.select = null;
            }
        }
    }

    class Lobby$1 extends Task {
        lobby;
        main() {
            const lobby = this.lobby = this.arena.create('lobby');
            // get names of hero packs and card packs
            const heropacks = [];
            const cardpacks = [];
            const configs = {};
            Object.assign(configs, this.arena.mode.config);
            for (const name of this.arena.packs) {
                const heropack = this.arena.accessExtension(name, 'heropack');
                const cardpack = this.arena.accessExtension(name, 'cardpack');
                if (heropack) {
                    heropacks.push(name);
                }
                if (cardpack) {
                    cardpacks.push(name);
                }
            }
            // configuration for player number
            const np = this.arena.mode.np;
            let npmax;
            if (typeof np === 'number') {
                npmax = np;
            }
            else {
                npmax = np[np.length - 1];
                configs.np = {
                    name: '游戏人数',
                    options: [],
                    init: npmax
                };
                for (const n of np) {
                    configs.np.options.push([n, `<span class="mono">${n}</span>人`]);
                }
            }
            // create lobby
            lobby.data.npmax = npmax;
            lobby.data.pane = { heropacks, cardpacks, configs };
            this.add('awaitStart');
            this.add('cleanUp');
        }
        /** Await initial configuration. */
        awaitStart() {
            const lobby = this.lobby;
            lobby.data.owner = this.arena.owner;
            lobby.monitor('updateLobby');
            lobby.await();
        }
        /** Update game configuration. */
        updateLobby([type, key, val]) {
            if (type === 'sync') {
                // game connected to or disconnected from hub
                if (val[1]) {
                    const config = this.arena.config = { online: val[0], banned: {} };
                    this.arena.utils.apply(config, val[1]);
                    // fill default entries
                    for (const key in this.arena.mode.config) {
                        const entry = this.arena.mode.config[key];
                        const requires = entry.requires;
                        if ((val[0] && requires === '!online') || (!val[0] && requires === 'online')) {
                            delete this.arena.config[key];
                        }
                        else {
                            this.arena.config[key] ??= entry.init;
                        }
                    }
                    // fill player number
                    const np = this.arena.mode.np;
                    if (Array.isArray(np)) {
                        if (!('np' in config)) {
                            config.np = np[np.length - 1];
                        }
                    }
                    else if (typeof np === 'number') {
                        config.np = np;
                    }
                    this.lobby.data.config = config;
                }
                // add callback for client operations
                const peers = this.arena.hub.peers;
                if (peers) {
                    for (const peer of peers) {
                        peer.monitor('updatePeer');
                    }
                }
            }
            else if (type === 'config') {
                if (key === 'online') {
                    // enable or disable multiplayer mode
                    if (val) {
                        connect(val);
                    }
                    else {
                        disconnect();
                    }
                }
                else {
                    // make sure np in range
                    if (key === 'np') {
                        const np = this.arena.mode.np;
                        if (!Array.isArray(np) || val < np[0] || val > np[np.length - 1]) {
                            return;
                        }
                    }
                    // game configuration change
                    this.arena.config[key] = val;
                    this.lobby.patch('config', { [key]: val });
                    // update seats in the lobby
                    if (key === 'np') {
                        const players = this.arena.hub.players;
                        if (players && players.length > val) {
                            for (let i = val; i < players.length; i++) {
                                players[i].data.playing = false;
                            }
                        }
                        update();
                    }
                }
            }
            else if (type === 'banned') {
                const [section, name] = this.arena.utils.split(key, '/');
                const set = new Set(this.arena.config.banned[section]);
                set[val ? 'delete' : 'add'](name);
                const banned = Array.from(set);
                this.lobby.patch('config', { banned: { [section]: banned } });
                this.arena.config.banned[section] = banned;
            }
            else if (type === 'start') {
                this.lobby.call('checkStart', [
                    this.arena.mode.minHeroCount,
                    this.arena.heros.size,
                    this.arena.mode.minPileCount,
                    this.arena.pile.length
                ]);
            }
        }
        /** Update info about joined players. */
        updatePeer(val, peer) {
            if (val === 'spectate' && peer.data.playing) {
                peer.data.playing = false;
                update();
            }
            else if (val === 'play' && !peer.data.playing && this.arena.hub.players.length < this.arena.config.np) {
                peer.data.playing = true;
                update();
            }
            else if (val === 'prepare') {
                if (peer.owner === this.arena.owner) {
                    peer.data.ready = [14, Date.now()];
                }
                else {
                    peer.data.ready = true;
                }
            }
            else if (val === 'unprepare') {
                peer.data.ready = false;
            }
        }
        /** Remove lobby and start game. */
        cleanUp() {
            this.lobby.unlink();
            this.arena.start();
        }
    }

    const taskClasses = new Map();
    taskClasses.set('choose', Choose);
    taskClasses.set('lobby', Lobby$1);
    taskClasses.set('task', Task);

    /** Accessor of hub properties. */
    class Hub {
        get peers() {
            return getPeers();
        }
        get players() {
            return getPeers({ playing: true });
        }
        get spectators() {
            return getPeers({ playing: false });
        }
    }
    /** Game object used by stages. */
    class Arena extends Link {
        /** Game mode. */
        mode;
        /** Game configuration. */
        config = {};
        /** Created players. */
        players = new Map();
        /** Created cards. */
        cards = new Map();
        /** Created skills. */
        skills = new Map();
        /** Created minions. */
        minions = new Map();
        /** Hub accessor. */
        #hub = new Hub();
        get owner() {
            return uid;
        }
        get hub() {
            return this.#hub;
        }
        get connected() {
            return peers ? true : false;
        }
        get utils() {
            return utils;
        }
        get accessExtension() {
            return accessExtension;
        }
        get packs() {
            return this.data.packs;
        }
        /** Available hero packs. */
        get heropacks() {
            const packs = [];
            for (const pack of this.packs) {
                if (this.config.banned.heropack?.includes(pack)) {
                    continue;
                }
                if (this.accessExtension(pack, 'heropack')) {
                    packs.push(pack);
                }
            }
            return packs;
        }
        /** Available card packs. */
        get cardpacks() {
            const packs = [];
            for (const pack of this.packs) {
                if (this.config.banned.cardpack?.includes(pack)) {
                    continue;
                }
                if (this.accessExtension(pack, 'cardpack')) {
                    packs.push(pack);
                }
            }
            return packs;
        }
        /** Get a list of all heros. */
        get heros() {
            const heros = new Set();
            for (const pack of this.heropacks) {
                const ext = this.accessExtension(pack);
                for (const name in ext?.hero) {
                    const id = pack + ':' + name;
                    if (this.config.banned?.hero?.includes(id)) {
                        continue;
                    }
                    heros.add(id);
                }
            }
            return heros;
        }
        /** Get card pile entries. */
        get pile() {
            const pile = [];
            for (const pack of this.cardpacks) {
                const ext = this.accessExtension(pack);
                for (const name in ext?.pile) {
                    for (const suit in ext?.pile[name]) {
                        for (let entry of ext?.pile[name][suit]) {
                            if (typeof entry === 'number') {
                                entry = [entry];
                            }
                            pile.push([name, suit, ...entry]);
                        }
                    }
                }
            }
            return pile;
        }
        /** Get a link by ID. */
        getLink(id) {
            return room.links.get(id);
        }
        /** Get a task by ID. */
        getTask(id) {
            return room.stages.get(id).task;
        }
        /** Get a player by ID. */
        getPlayer(id) {
            return this.players.get(id);
        }
        /** Call a task method. */
        callTask([id, method], ...args) {
            return this.getTask(id)[method](...args);
        }
        /** Get the number of arguments of a task method. */
        countArgs([id, method]) {
            return this.getTask(id)[method].length;
        }
        /** Create a link. */
        create(tag) {
            return room.create(tag);
        }
        /** Mark game as started and disallow changing configuration. */
        start() {
            freeze(this.config);
            room.progress = 1;
            update();
        }
        /** Mark game as over. */
        over() {
            room.progress = 2;
            update();
        }
        /** Backup game state. */
        backup() { }
        ;
        /** Restore game state. */
        restore() { }
        ;
    }

    class Card extends Link {
    }

    class Lobby extends Link {
    }

    class Minion extends Link {
    }

    class Peer extends Link {
    }

    class Player extends Link {
    }

    class Skill extends Link {
    }

    const linkClasses = new Map();
    linkClasses.set('arena', Arena);
    linkClasses.set('card', Card);
    linkClasses.set('link', Link);
    linkClasses.set('lobby', Lobby);
    linkClasses.set('minion', Minion);
    linkClasses.set('peer', Peer);
    linkClasses.set('player', Player);
    linkClasses.set('skill', Skill);

    // setup default task and  classes
    for (const [task, cls] of linkClasses) {
        linkClasses$1.set(task, cls);
    }
    for (const [task, cls] of taskClasses) {
        taskClasses$1.set(task, cls);
    }
    self.onmessage = ({ data }) => {
        if (data[1] === 0) {
            self.onmessage = ({ data }) => dispatch(data);
            init(data[0], data[3][2]);
            setRoom(new Room());
            room.init(data[3][0], data[3][1]);
        }
    };
    self.postMessage('ready');

}());
