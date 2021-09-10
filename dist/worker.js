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
    const gameClasses$1 = new Map();
    let room;
    /** Initial configurations from client. */
    let uid;
    let info;
    function setRoom(r) {
        room = r;
        if (debug) {
            self.room = r;
        }
    }
    function init(u, i) {
        uid = u;
        info = i;
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
        room.arena.peers = ids;
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
            room.game.mode.name,
            // joined players
            getPeers({ playing: true })?.length ?? 1,
            // number of players in a game
            room.game.config.np,
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
    /** Create a peer component. */
    function createPeer(uid, info) {
        const peer = room.create('peer');
        peer.update({
            owner: uid,
            nickname: info[0],
            avatar: info[1],
            playing: getPeers({ playing: true }).length < room.game.config.np
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
    function getInfo(type, id) {
        const [ext, name] = split(id);
        return accessExtension(ext, type, name);
    }
    /** Create a filter to check if item is selectable. */
    function createFilter(section, selected, selects, getData, task) {
        // check if more items can be selected
        const sel = selects[section];
        const max = Array.isArray(sel.num) ? sel.num[1] : sel.num;
        // get function from extension
        if (!sel.filter) {
            return () => selected[section].length < max;
        }
        const func = accessExtension(sel.filter);
        // wrap function with this and task argument
        const filterThis = {
            selected, selects,
            getInfo, getData, accessExtension
        };
        for (const key in sel) {
            filterThis[key] = sel[key];
        }
        return (item) => {
            if (selected[section].length >= max) {
                return false;
            }
            return func.apply(filterThis, [item, task]);
        };
    }

    /** Room that controls game flow and classes. */
    class Room {
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
        #taskClasses;
        /** Base game classes. */
        #gameClasses;
        /** Number of links created. */
        #linkCount = 0;
        /** Number of stages created. */
        #stageCount = 0;
        /** Currently paused by stage.awaits. */
        #paused = true;
        async init(name, packs) {
            // initialize classes
            this.#gameClasses = new Map(gameClasses$1);
            this.#taskClasses = new Map(taskClasses$1);
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
                const cls = section.inherit ? this.getTask(section.inherit) : this.#gameClasses.get('task');
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

    /** Base class for a Link wrapper. */
    class Linked {
        /** Game object. */
        #game;
        /** Link to player component. */
        #link;
        get id() {
            return this.link.id;
        }
        get owner() {
            return this.link.owner ?? null;
        }
        get link() {
            return this.#link;
        }
        get game() {
            return this.#game;
        }
        constructor(game, tag) {
            this.#game = game;
            this.#link = game.create(tag);
        }
    }

    class Card extends Linked {
    }

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
    class Game {
        /** Game mode. */
        mode;
        /** Game configuration. */
        config = {};
        /** Hero packages. */
        packs;
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
        get arena() {
            return room.arena;
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
        get getInfo() {
            return getInfo;
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
        /** Get a link. */
        get(id) {
            return room.links.get(id)[0];
        }
        /** Create a link. */
        create(tag) {
            return room.create(tag);
        }
        /** Creata a class in game.#gameClasses. */
        createLinked(type) {
            const linked = new (room.getClass(type))(this, type);
            const map = this[type + 's'];
            if (map instanceof Map) {
                map.set(linked.id, linked);
            }
            return linked;
        }
        /** Create a new player. */
        createPlayer() {
            return this.createLinked('player');
        }
        /** Create a new card. */
        createCard() {
            return this.createLinked('card');
        }
        /** Create a new skill. */
        createSkill() {
            return this.createLinked('skill');
        }
        /** Create a new card. */
        createMinion() {
            return this.createLinked('minion');
        }
        /** Create a filter that determines if an item can be selected. */
        createFilter(section, selected, sels, task) {
            return createFilter(section, selected, sels, (id) => new Proxy(this.get(id), {
                get(target, key) {
                    return target[key];
                }
            }), task);
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
    }

    class Minion extends Linked {
    }

    class Player extends Linked {
    }

    class Skill extends Linked {
    }

    class Task {
        /** Do not trigger before / after / skip event. */
        silent = false;
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

    class Lobby extends Task {
        lobby;
        main() {
            const lobby = this.lobby = this.game.create('lobby');
            // get names of hero packs and card packs
            const heropacks = [];
            const cardpacks = [];
            const configs = {};
            Object.assign(configs, this.game.mode.config);
            for (const name of this.game.packs) {
                const heropack = this.game.accessExtension(name, 'heropack');
                const cardpack = this.game.accessExtension(name, 'cardpack');
                if (heropack) {
                    heropacks.push(name);
                }
                if (cardpack) {
                    cardpacks.push(name);
                }
            }
            // configuration for player number
            const np = this.game.mode.np;
            let npmax;
            if (typeof np === 'number') {
                this.game.config.np = np;
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
                this.game.config.np = npmax;
            }
            // create lobby
            lobby.npmax = npmax;
            lobby.pane = { heropacks, cardpacks, configs };
            this.add('awaitStart');
            this.add('cleanUp');
        }
        /** Await initial configuration. */
        awaitStart() {
            const lobby = this.lobby;
            lobby.owner = this.game.owner;
            lobby.monitor('updateLobby');
            lobby.await();
        }
        /** Update game configuration. */
        updateLobby([type, key, val]) {
            if (type === 'sync') {
                // game connected to or disconnected from hub
                this.game.config.online = val[0];
                this.game.config.banned = {};
                this.game.utils.apply(this.game.config, val[1]);
                for (const key in this.game.mode.config) {
                    const entry = this.game.mode.config[key];
                    const requires = entry.requires;
                    if ((val[0] && requires === '!online') || (!val[0] && requires === 'online')) {
                        delete this.game.config[key];
                    }
                    else {
                        this.game.config[key] ??= entry.init;
                    }
                }
                this.lobby.config = this.game.config;
                // add callback for client operations
                const peers = this.game.hub.peers;
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
                        const np = this.game.mode.np;
                        if (!Array.isArray(np) || val < np[0] || val > np[np.length - 1]) {
                            return;
                        }
                    }
                    // game configuration change
                    this.game.config[key] = val;
                    this.lobby.config = this.game.config;
                    // update seats in the lobby
                    if (key === 'np') {
                        const players = this.game.hub.players;
                        if (players && players.length > val) {
                            for (let i = val; i < players.length; i++) {
                                players[i].playing = false;
                            }
                        }
                        update();
                    }
                }
            }
            else if (type === 'banned') {
                const [section, name] = this.game.utils.split(key, '/');
                const set = new Set(this.game.config.banned[section]);
                set[val ? 'delete' : 'add'](name);
                if (set.size) {
                    this.game.config.banned[section] = Array.from(set);
                }
                else {
                    delete this.game.config.banned[section];
                }
                this.lobby.config = this.game.config;
            }
            else if (type === 'start') {
                this.lobby.call('checkStart', [
                    this.game.mode.minHeroCount,
                    this.game.heros.size,
                    this.game.mode.minPileCount,
                    this.game.pile.length
                ]);
            }
        }
        /** Update info about joined players. */
        updatePeer(val, peer) {
            if (val === 'spectate' && peer.playing) {
                peer.playing = false;
                update();
            }
            else if (val === 'play' && !peer.playing && this.game.hub.players.length < this.game.config.np) {
                peer.playing = true;
                update();
            }
            else if (val === 'prepare') {
                if (peer.owner === this.game.owner) {
                    peer.ready = [14, Date.now()];
                }
                else {
                    peer.ready = true;
                }
            }
            else if (val === 'unprepare') {
                peer.ready = false;
            }
        }
        /** Remove lobby and start game. */
        cleanUp() {
            this.lobby.unlink();
            this.game.start();
        }
    }

    const gameClasses = new Map();
    const taskClasses = new Map();
    gameClasses.set('card', Card);
    gameClasses.set('game', Game);
    gameClasses.set('linked', Linked);
    gameClasses.set('minion', Minion);
    gameClasses.set('player', Player);
    gameClasses.set('skill', Skill);
    gameClasses.set('task', Task);
    taskClasses.set('lobby', Lobby);

    // setup default task and  classes
    for (const [task, cls] of gameClasses) {
        gameClasses$1.set(task, cls);
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
