(function () {
    'use strict';

    const version = '2.0.0dev1';

    class Stage {
        constructor(id, path, data, game, worker, setStage, setData) {
            /** Current step of execution. Action:
             * 0: generate this.before
             * 1: execute this.before[]
             * 2: execute main function and update await user input
             * 3: execute this.main[]
             * 4: generate this.after
             * 5: execute this.after[]
             * 6: no action (done)
            */
            this.#step = 0;
            /** Execution status.
             * 0: normal
             * 1: skipped
             * 2: cancelled
             */
            this.#code = 0;
            /** Parent stage. */
            this.#location = null;
            /** Child stages added by before event. */
            this.#before = [];
            /** Child stages added by main function. */
            this.#main = [];
            /** Child stages added by after event. */
            this.#after = [];
            /** Pending return values from clients. */
            this.#monitors = new Map();
            /** Return value of this.calls. */
            this.#results = new Map();
            /** Resolved when all monitors are done. */
            this.#resolve = null;
            this.#id = id;
            this.#path = path;
            this.#game = game;
            this.#worker = worker;
            this.#setStage = setStage;
            // create getter and setter of stage data
            this.#data = new Proxy(data, {
                get: (data, key) => {
                    return data[key] ?? null;
                },
                set: (data, key, val) => {
                    data[key] = val;
                    setData.apply(game, [this.id, { [key]: val }]);
                    return true;
                }
            });
            // start game if this is rootStage
            if (id === 1) {
                setTimeout(() => this.#run());
            }
        }
        /** Stage ID. */
        #id;
        /** Path to the function to be executed.
         * ruleset item: <section>.<rule>
         * mode: <extension>:mode
         * skill: <extension>:skill.<skillname>
         * card: <extension>:card.<cardname>
         * hero: <extension>:hero.<heroname>
        */
        #path;
        /** Reference to game object. */
        #game;
        /** Reference to worker object. */
        #worker;
        /** Current step of execution. Action:
         * 0: generate this.before
         * 1: execute this.before[]
         * 2: execute main function and update await user input
         * 3: execute this.main[]
         * 4: generate this.after
         * 5: execute this.after[]
         * 6: no action (done)
        */
        #step;
        /** Execution status.
         * 0: normal
         * 1: skipped
         * 2: cancelled
         */
        #code;
        /** Parent stage. */
        #location;
        /** Child stages added by before event. */
        #before;
        /** Child stages added by main function. */
        #main;
        /** Child stages added by after event. */
        #after;
        /** Pending return values from clients. */
        #monitors;
        /** Return value of this.calls. */
        #results;
        /** Resolved when all monitors are done. */
        #resolve;
        /** Make self as game.activateStage. */
        #setStage;
        /** Stage data. */
        #data;
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
        get parent() {
            return this.#location ? this.#location[0] : this;
        }
        get path() {
            return this.#path;
        }
        /** Get all siblings. */
        get siblings() {
            if (this.#location) {
                return this.#location[0].#getChildren(this.#location[1]);
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
        /** Game data accessor. */
        get data() {
            return this.#data;
        }
        /** Add a callback for component function call. */
        monitor(id, path) {
            this.#monitors.set(id, path);
        }
        /** Pause step 2 until a return value is received. */
        await(id) {
            this.#results.set(id, null);
        }
        /** Skip stage (may trigger skip event). */
        skip() {
            if (this.#step < 2) {
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
        getSibling(select) {
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
        add(path) {
            const stage = this.game.createStage(this.#getPath(path));
            stage.#location = [this, this.#getLocation()];
            this.#getChildren().push(stage);
            return stage;
        }
        /** Add a sibling next to this. */
        addSibling(path) {
            const stage = this.game.createStage(this.#getPath(path));
            stage.#location = this.#location;
            const siblings = this.siblings;
            for (let i = 0; i < siblings.length; i++) {
                if (Object.is(siblings[i], this)) {
                    siblings.splice(i + 1, 0, stage);
                    return stage;
                }
            }
            throw ('failed to add sibling');
        }
        /** Execute root stage until all done or game over. */
        async #run() {
            if (Object.is(this.game.rootStage, this)) {
                while (this.#game.state < 2 && await this.#next())
                    ;
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
                        const owner = this.game.links.get(id).owner;
                        const peers = this.#worker.peers;
                        if (!owner || (peers && !peers.has(owner))) {
                            this.results.set(id, '#auto');
                        }
                    }
                }
                // await return value from client
                if (!this.#checkResolve()) {
                    await new Promise(resolve => this.#resolve = resolve);
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
                for (const stage of this.#getChildren()) {
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
        #getPath(content) {
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
        #dispatch(id, result, done) {
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
                    const link = this.#game.links.get(id);
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
        #getLocation() {
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
        #getChildren(location) {
            location ??= this.#getLocation();
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

    /** A link to a client-side component. */
    class Link {
        constructor(id, tag, game, update) {
            /** Properties synced with worker. */
            this.#props = new Map();
            this.#id = id;
            this.#tag = tag;
            this.#game = game;
            this.#update = update;
            update.apply(game, [this.#id, tag]);
        }
        /** Component ID. */
        #id;
        /** Component tag. */
        #tag;
        /** Properties synced with worker. */
        #props;
        /** Reference to Game. */
        #game;
        /** Reference to this.#game.#update */
        #update;
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
            this.#update.apply(this.#game, [this.#id, items]);
        }
        /** Call a component method. */
        call(method, arg) {
            this.#update.apply(this.#game, [this.#id, [method, arg]]);
        }
        /** Monitor the return value of a component call. */
        monitor(monitor) {
            this.#game.activeStage.monitor(this.#id, monitor);
        }
        /** Pause step 3 of active stage until return value is received. */
        await() {
            this.#game.activeStage.await(this.#id);
        }
        /** Remove reference to a component. */
        unlink() {
            this.#update.apply(this.#game, [this.#id, null]);
        }
        /** Get tag and object of all properties. */
        flatten() {
            return [this.#tag, Object.fromEntries(this.#props)];
        }
    }

    /** Deep copy object. */
    /** Access key of a nested object. */
    function access(obj, keys) {
        for (const key of keys.split('.')) {
            obj = obj[key] ?? null;
            if (obj === null) {
                break;
            }
        }
        return obj;
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

    class Game {
        constructor(content, worker) {
            /** Current game stage. */
            this.#active = null;
            /** Links to components. */
            this.#links = new Map();
            /** Banned packages. */
            this.#banned = {
                heropacks: new Set(),
                cardpacks: new Set(),
                heros: new Set(),
                cards: new Set(),
            };
            /** All created stages. */
            this.#stages = new Map();
            /** Loaded extensions. */
            this.#extensions = new Map();
            /** Array of packages that define ruleset (priority: high -> low). */
            this.#ruleset = [];
            /** Game state.
             * 0: waiting
             * 1: gaming
             * 2: over
            */
            this.#state = 0;
            /** Ticked history items with timestamp. */
            this.#history = [];
            /** Entries to be ticked. */
            this.#ticks = [];
            /** Number of links created. */
            this.#linkCount = 0;
            /** Number of stages created. */
            this.#stageCount = 0;
            this.#worker = worker;
            this.#mode = content[0];
            this.#packs = new Set(content[1]);
            this.#banned.heropacks = new Set(content[2]);
            this.#banned.cardpacks = new Set(content[3]);
            this.#config = content[4];
            this.#worker.info = content[5];
            // create getter and setter of game data
            this.#data = new Proxy({}, {
                get: (data, name) => {
                    return data[name] ?? null;
                },
                set: (data, key, val) => {
                    data[key] = val;
                    this.#setData(null, { [key]: val });
                    return true;
                }
            });
            // load extensions
            Promise.all(content[1].map(async (pack) => {
                const ext = freeze((await import(`../extensions/${pack}/main.js`)).default);
                this.#extensions.set(pack, ext);
            })).then(async () => {
                // add ruleset based on reference order
                let mode = this.#mode;
                while (mode) {
                    if (this.#ruleset.includes(mode)) {
                        break;
                    }
                    this.#ruleset.push(mode);
                    mode = this.#extensions.get(mode)?.inherit;
                }
                // start game
                this.#rootStage = this.createStage(`${this.mode}:mode/`);
                this.#arena = this.create('arena');
            });
            // handle return message from client
            self.onmessage = ({ data }) => this.#dispatch(data);
        }
        /** Root game stage. */
        #rootStage;
        /** Current game stage. */
        #active;
        /** Links to components. */
        #links;
        /** Game mode. */
        #mode;
        /** Game configuration. */
        #config;
        /** Game data. */
        #data;
        /** Hero packages. */
        #packs;
        /** Banned packages. */
        #banned;
        /** All created stages. */
        #stages;
        /** Loaded extensions. */
        #extensions;
        /** Worker reference. */
        #worker;
        /** Arena link. */
        #arena;
        /** Array of packages that define ruleset (priority: high -> low). */
        #ruleset;
        /** Game state.
         * 0: waiting
         * 1: gaming
         * 2: over
        */
        #state;
        /** Ticked history items with timestamp. */
        #history;
        /** Entries to be ticked. */
        #ticks;
        /** Number of links created. */
        #linkCount;
        /** Number of stages created. */
        #stageCount;
        get arena() {
            return this.#arena;
        }
        get mode() {
            return this.#mode;
        }
        get config() {
            return this.#config;
        }
        get packs() {
            return this.#packs;
        }
        get banned() {
            return this.#banned;
        }
        get rootStage() {
            return this.#rootStage;
        }
        get activeStage() {
            return this.#active ? this.#active[0] : null;
        }
        get links() {
            return this.#links;
        }
        get uid() {
            return this.#worker.uid;
        }
        get state() {
            return this.#state;
        }
        /** Connected clients. */
        get peers() {
            if (this.#worker.peers) {
                return Array.from(this.#worker.peers.values());
            }
            return null;
        }
        /** Connected players. */
        get peerPlayers() {
            return this.#worker.getPeers({ playing: true });
        }
        /** Connected spectators. */
        get peerSpectators() {
            return this.#worker.getPeers({ playing: false });
        }
        /** Game data accessor. */
        get data() {
            return this.#data;
        }
        create(tag) {
            const id = ++this.#linkCount;
            const link = new Link(id, tag, this, this.#update);
            this.links.set(id, link);
            return link;
        }
        createStage(name, data) {
            const id = ++this.#stageCount;
            const stage = new Stage(id, name, data ?? {}, this, this.#worker, this.#setStage, this.#setData);
            this.#stages.set(id, stage);
            return stage;
        }
        /** Get the function based on string. Format:
         * #<path>/<section>: from this.ruleset
         * <extname>:<path>/<section>: from an extension
         */
        getRule(path) {
            if (path[0] === '#') {
                // get ruleset
                path = path.slice(1);
                for (const name of this.#ruleset) {
                    const rule = this.getRule(name + ':ruleset.' + path);
                    if (rule !== null) {
                        return rule;
                    }
                }
            }
            else {
                // get the content of an extension
                const [name, content] = split(path);
                const ext = this.#extensions.get(name);
                if (ext) {
                    const [keys, section] = content.split('/');
                    const rule = access(ext, keys);
                    if (section === '') {
                        return rule.content ?? null;
                    }
                    else if (typeof section === 'string') {
                        return rule.contents[section] ?? null;
                    }
                    else {
                        return rule ?? null;
                    }
                }
                else {
                    return null;
                }
            }
        }
        /** Update room info for idle clients. */
        updateRoom(push = true) {
            const room = JSON.stringify([
                // mode name
                this.getRule(this.mode + ':mode').name,
                // joined players
                this.#worker.getPeers({ playing: true })?.length ?? 1,
                // number of players in a game
                this.config.np,
                // nickname and avatar of owner
                this.#worker.info,
                // game state
                this.state
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
            });
        }
        /** Get a UITick of all links. */
        pack() {
            const tags = {};
            const props = {};
            for (const [uid, link] of this.links.entries()) {
                [tags[uid], props[uid]] = link.flatten();
            }
            return [this.activeStage?.id || 0, tags, props, {}];
        }
        /** Mark game as started and disallow changing configuration. */
        start() {
            freeze(this.#config);
            freeze(this.#packs);
            freeze(this.#banned);
            this.#state = 1;
            this.updateRoom();
        }
        /** Connect to remote hub. */
        connect(url) {
            this.#worker.connect(url);
        }
        /** Disconnect from remote hub. */
        disconnect() {
            this.#worker.disconnect();
        }
        /** Add component update (called by Link). */
        #update(id, item) {
            if (this.#ticks.length === 0) {
                // schedule a UITick if no pending UITick exists
                setTimeout(() => this.#tick());
            }
            this.#ticks.push([this.activeStage?.id ?? null, id, item]);
        }
        /** Set active stage (called by Stage). */
        #setStage(content) {
            this.#active = content ?? null;
        }
        /** Set stage data (called by Stage). */
        #setData(stageID, data) {
            // make data savable as string
            const flatten = this.getRule('#data.flatten');
            if (flatten) {
                for (const key in data) {
                    data[key] = flatten(data[key]);
                }
            }
            if (this.#ticks.length === 0) {
                // directly add to history if no UITick is scheduled
                this.#pushData(stageID, data);
            }
            else {
                this.#ticks.push([stageID, data]);
            }
        }
        /** Add data update to history. */
        #pushData(stageID, data) {
            const lastEntry = this.#history[this.#history.length - 1];
            if (lastEntry[1].length === 2 && lastEntry[1][0] === stageID) {
                // merge consecutive data updates into 1 object
                Object.assign(lastEntry[1][1], data);
            }
            else {
                this.#history.push([Date.now(), [stageID, data]]);
            }
        }
        /** Create a UITick from this.#history. */
        #tick() {
            let stageID = -1;
            let tagChanges = {};
            let propChanges = {};
            let calls = {};
            // save current timestamp in this.#history
            const now = Date.now();
            for (const entry of this.#ticks) {
                if (entry.length === 3) {
                    const [sid, id, item] = entry;
                    // split UITick by stage change
                    if (sid !== stageID) {
                        if (stageID !== -1) {
                            this.#worker.broadcast([stageID, tagChanges, propChanges, calls]);
                            tagChanges = {};
                            propChanges = {};
                            calls = {};
                        }
                        stageID = sid;
                    }
                    // merge history entries into a single UITick
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
                    this.#history.push([now, entry]);
                }
                else {
                    this.#pushData(...entry);
                }
            }
            this.#worker.broadcast([stageID, tagChanges, propChanges, calls]);
            this.#ticks.length = 0;
        }
        /** Dispatch message from client. */
        async #dispatch(data) {
            try {
                const [uid, sid, id, result, done] = data;
                if (id < 0) {
                    // reload UI upon error
                    this.#worker.send(uid, this.pack());
                }
                else if (this.#active && sid === this.#active[0].id && this.links.get(id)?.owner === uid) {
                    // send result to listener
                    this.#active[1].apply(this.#active[0], [id, result, done]);
                }
            }
            catch (e) {
                console.log(e);
            }
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
            /** Links of connected clients. */
            this.peers = null;
            self.onmessage = ({ data }) => {
                this.uid = data[0];
                this.game = new Game(data[3], this);
            };
            self.postMessage('ready');
        }
        /** Send a message to all clients. */
        broadcast(tick) {
            if (this.game && this.connection) {
                // broadcast tick
                this.connection.send('bcast:' + JSON.stringify(tick));
            }
            this.tick(tick);
        }
        /** Send a message to a client. */
        send(uid, tick) {
            if (uid === this.uid) {
                this.tick(tick);
            }
            else if (this.game && this.peers) {
                // send tick to a remote client
                this.connection.send('to:' + JSON.stringify([
                    uid, JSON.stringify(tick)
                ]));
            }
        }
        /** Send a message to local client. */
        tick(tick) {
            self.postMessage(tick);
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
                }
                if (this.peers) {
                    for (const peer of this.peers.values()) {
                        peer.unlink();
                    }
                }
                this.peers = null;
                this.sync();
            };
            ws.onopen = () => {
                ws.send('init:' + JSON.stringify([this.uid, this.info, this.game.updateRoom(false)]));
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
            this.game.arena.update({ peers });
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
            this.game.updateRoom();
            this.send(uid, this.game.pack());
        }
        /** A remote client leaves the room. */
        leave(uid) {
            if (this.peers?.has(uid)) {
                this.peers.get(uid).unlink();
                this.peers.delete(uid);
                this.sync();
                this.game.updateRoom();
            }
        }
        /** A remote client sends a response message. */
        resp(msg) {
            self.onmessage({ data: JSON.parse(msg) });
        }
        /** Create a peer component. */
        createPeer(uid, info) {
            const peer = this.game.create('peer');
            peer.update({
                owner: uid,
                nickname: info[0],
                avatar: info[1],
                playing: this.getPeers({ playing: true }).length < this.game.config.np
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
                    if (peer.get(key) !== filter[key]) {
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
    }

    const worker = new Worker();
    globalThis.worker = worker;

}());
