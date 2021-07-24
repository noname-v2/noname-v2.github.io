(function () {
    'use strict';

    const version = '2.0.0dev1';

    class Stage {
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
        #step = 0;
        /** Execution status.
         * 0: normal
         * 1: skipped
         * 2: cancelled
         */
        #code = 0;
        /** Parent stage. */
        #location = null;
        /** Child stages added by before event. */
        #before = [];
        /** Child stages added by main function. */
        #main = [];
        /** Child stages added by after event. */
        #after = [];
        /** Pending return values from clients. */
        #monitors = new Map();
        /** Return value of this.calls. */
        #results = new Map();
        /** Resolved when all monitors are done. */
        #resolve = null;
        /** Make self as game.activateStage. */
        #focus;
        /** Stage data. */
        #data;
        /** All awaits have been resolved. */
        get #resolved() {
            for (const val of this.results.values()) {
                if (val === null) {
                    return false;
                }
            }
            return true;
        }
        /** Current location. */
        get #current() {
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
        constructor(id, path, data, game, worker, focus) {
            this.#id = id;
            this.#path = path;
            this.#game = game;
            this.#worker = worker;
            this.#focus = focus;
            this.#data = data;
            // start game if this is rootStage
            if (id === 1) {
                setTimeout(() => this.#run());
            }
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
                this.#step = 6;
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
            stage.#location = [this, this.#current];
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
                this.#focus.call(this.game, [this, this.#dispatch]);
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
                if (!this.#resolved) {
                    await new Promise(resolve => this.#resolve = resolve);
                    this.#resolve = null;
                }
                // remove active stage
                this.#focus.call(this.game);
            }
            else if (this.#step === 4) {
                // generate this.after
                await this.game.getRule('#stage.after/').apply(this);
            }
            else if (this.#current) {
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
            if (this.#step !== 2) {
                return;
            }
            if (done) {
                // results: component.return() -> link.await()
                if (this.results.get(id) === null) {
                    this.results.set(id, result ?? '#auto');
                    if (this.#resolve && this.#resolved) {
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
        /** Get child stages based on current step. */
        #getChildren(location) {
            location ??= this.#current;
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
        /** Component ID. */
        #id;
        /** Component tag. */
        #tag;
        /** Properties synced with worker. */
        #props = new Map();
        /** Reference to Game. */
        #game;
        /** Reference to this.#game.#update */
        #tick;
        constructor(id, tag, game, tick) {
            this.#id = id;
            this.#tag = tag;
            this.#game = game;
            this.#tick = tick;
            tick.apply(game, [this.#id, tag]);
        }
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
            this.#tick.apply(this.#game, [this.#id, items]);
        }
        /** Call a component method. */
        call(method, arg) {
            this.#tick.apply(this.#game, [this.#id, [method, arg]]);
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
            this.#tick.apply(this.#game, [this.#id, null]);
        }
        /** Get tag and object of all properties. */
        flatten() {
            return [this.#tag, Object.fromEntries(this.#props)];
        }
    }

    /** Deep assign object. */
    function apply(from, to) {
        for (const key in from) {
            if (from[key] === null) {
                delete to[key];
            }
            else if (typeof from[key] === 'object' && typeof to[key] === 'object' && to[key]) {
                apply(from[key], to[key]);
            }
            else {
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

    class Game {
        /** Root game stage. */
        #rootStage;
        /** Current game stage. */
        #active = null;
        /** Links to components. */
        #links = new Map();
        /** Game mode. */
        #mode;
        /** Game configuration. */
        #config;
        /** Game data. */
        #data = {};
        /** Hero packages. */
        #packs;
        /** Banned packages. */
        #banned = {
            heropacks: new Set(),
            cardpacks: new Set(),
            heros: new Set(),
            cards: new Set(),
        };
        /** All created stages. */
        #stages = new Map();
        /** Loaded extensions. */
        #extensions = new Map();
        /** Worker reference. */
        #worker;
        /** Arena link. */
        #arena;
        /** Array of packages that define ruleset (priority: high -> low). */
        #ruleset = {};
        /** Game state.
         * 0: waiting
         * 1: gaming
         * 2: over
        */
        #state = 0;
        /** Ticked history items with timestamp. */
        #history = [];
        /** Entries to be ticked. */
        #ticks = [];
        /** Number of links created. */
        #linkCount = 0;
        /** Number of stages created. */
        #stageCount = 0;
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
        constructor(content, worker) {
            this.#worker = worker;
            this.#mode = content[0];
            this.#packs = new Set(content[1]);
            this.#banned.heropacks = new Set(content[2]);
            this.#banned.cardpacks = new Set(content[3]);
            this.#config = content[4];
            this.#worker.info = content[5];
            // load extensions
            const load = async (pack) => {
                const ext = (await import(`../extensions/${pack}/main.js`)).default;
                this.#extensions.set(pack, ext);
            };
            Promise.all(content[1].map(load)).then(async () => {
                // included rulesets
                const inc = [];
                let mode = this.#mode;
                while (mode) {
                    if (inc.includes(mode)) {
                        break;
                    }
                    if (!this.#extensions.has(mode)) {
                        await load(mode);
                    }
                    inc.unshift(mode);
                    mode = this.#extensions.get(mode)?.inherit;
                }
                // add ruleset based on reference order
                for (const name of inc) {
                    apply(this.#extensions.get(name).ruleset ?? {}, this.#ruleset);
                }
                // start game
                this.#rootStage = this.createStage(`${this.mode}:mode/`);
                this.#arena = this.create('arena');
            });
            // handle return message from client
            self.onmessage = ({ data }) => this.#dispatch(data);
        }
        create(tag) {
            const id = ++this.#linkCount;
            const link = new Link(id, tag, this, this.#tick);
            this.links.set(id, link);
            return link;
        }
        createStage(name, data) {
            const id = ++this.#stageCount;
            const stage = new Stage(id, name, data ?? {}, this, this.#worker, this.#focus);
            this.#stages.set(id, stage);
            return stage;
        }
        /** Get the function based on string. Format:
         * #<path>/<section>: from this.ruleset
         * <extname>:<path>/<section>: from an extension
         */
        getRule(path) {
            let target;
            if (path[0] === '#') {
                // get ruleset
                target = this.#ruleset;
                path = path.slice(1);
            }
            else {
                // get the content of an extension
                let name;
                [name, path] = split(path);
                target = this.#extensions.get(name);
            }
            // access rule
            const [keys, section] = path.split('/');
            const rule = access(target, keys);
            if (section === '') {
                return rule?.content ?? null;
            }
            else if (typeof section === 'string') {
                return rule?.contents[section] ?? null;
            }
            else {
                return rule ?? null;
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
                resolve();
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
        #tick(id, item) {
            if (this.#ticks.length === 0) {
                // schedule a UITick if no pending UITick exists
                setTimeout(() => this.#commit());
            }
            this.#ticks.push([this.activeStage?.id ?? null, id, item]);
        }
        /** Set active stage (called by Stage). */
        #focus(content) {
            this.#active = content ?? null;
        }
        /** Create UITick(s) from this.#history. */
        #commit() {
            let stageID = -1;
            let tagChanges = {};
            let propChanges = {};
            let calls = {};
            // save current timestamp in this.#history
            const now = Date.now();
            for (const entry of this.#ticks) {
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
        /** Game object. */
        #game;
        /**
         * Setup communication.
         */
        constructor() {
            self.onmessage = ({ data }) => {
                this.uid = data[0];
                this.#game = new Game(data[3], this);
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
                ws.send('init:' + JSON.stringify([this.uid, this.info, this.#game.updateRoom(false)]));
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
            this.#game.updateRoom();
            this.send(uid, this.#game.pack());
        }
        /** A remote client leaves the room. */
        leave(uid) {
            if (this.peers?.has(uid)) {
                this.peers.get(uid).unlink();
                this.peers.delete(uid);
                this.sync();
                this.#game.updateRoom();
            }
        }
        /** A remote client sends a response message. */
        resp(msg) {
            self.onmessage({ data: JSON.parse(msg) });
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
