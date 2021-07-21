(function () {
    'use strict';

    class Database {
        constructor() {
            /** Cache for synthronous database. */
            this.cache = new Map();
            // open database
            const request = indexedDB.open('noname_v2', 2);
            const timeout = setTimeout(() => window.location.reload(), 3000); // workaround for Safari indexedDB problem
            // create new database
            request.onupgradeneeded = () => {
                // synchronous
                if (!request.result.objectStoreNames.contains('settings')) {
                    request.result.createObjectStore('settings');
                }
                // asynchronous
                if (!request.result.objectStoreNames.contains('files')) {
                    request.result.createObjectStore('files');
                }
            };
            // wait until database is ready
            this.ready = new Promise(resolve => {
                request.onsuccess = () => {
                    clearTimeout(timeout);
                    // save database
                    this.db = request.result;
                    // cache synchronous database
                    const store = this.db.transaction('settings', 'readonly').objectStore('settings');
                    const iterator = store.openCursor();
                    // iterate through database and save to this.cache
                    iterator.onsuccess = () => {
                        const cursor = iterator.result;
                        if (cursor) {
                            // set cache value and go to next entry
                            this.cache.set(cursor.key, cursor.value);
                            cursor.continue();
                        }
                        else {
                            // cache done
                            resolve();
                        }
                    };
                };
            });
        }
        /** Get, set or delete database entry. */
        transact(name, cmd, key, value) {
            return new Promise(resolve => {
                const mode = cmd === 'get' ? 'readonly' : 'readwrite';
                const store = this.db.transaction(name, mode).objectStore(name);
                const request = cmd === 'put' ? store[cmd](value, key) : store[cmd](key);
                request.onsuccess = () => resolve(request.result ?? null);
            });
        }
        /** Get value of synchronous database entry. */
        get(key) {
            return this.cache.get(key) ?? null;
        }
        /** Set value of synchronous database entry. */
        set(key, value) {
            if (value === null || value === undefined) {
                // delete entry
                this.cache.delete(key);
                this.transact('settings', 'delete', key);
            }
            else {
                // modify entry
                this.cache.set(key, value);
                this.transact('settings', 'put', key, value);
            }
        }
        /** Get value from asynchronous database. */
        readFile(key) {
            return this.transact('files', 'get', key);
        }
        /** Set value to asynchronous database. */
        writeFile(key, value) {
            if (value === null || value === undefined) {
                // delete entry
                return this.transact('files', 'delete', key);
            }
            else {
                // modify entry
                return this.transact('files', 'put', key, value);
            }
        }
        /** List all files. */
        readdir() {
            const store = this.db.transaction('files', 'readonly').objectStore('files');
            const iterator = store.openCursor();
            const files = [];
            return new Promise(resolve => {
                iterator.onsuccess = () => {
                    const cursor = iterator.result;
                    if (cursor) {
                        // set cache value and go to next entry
                        files.push(cursor.key);
                        cursor.continue();
                    }
                    else {
                        // cache done
                        resolve(files);
                    }
                };
            });
        }
    }

    class Component {
        /** Create node. */
        constructor(client, tag, id) {
            /** Properties synced with worker. */
            this.props = new Map();
            this.client = client;
            this.id = id;
            this.node = client.ui.createElement(tag);
            this.ready = Promise.resolve().then(() => this.init());
        }
        get db() {
            return this.client.db;
        }
        get ui() {
            return this.client.ui;
        }
        get app() {
            return this.client.ui.app;
        }
        get owner() {
            return this.get('owner');
        }
        /** Make init() optional for subclasses. */
        init() { }
        ;
        /** Property getter. */
        get(key) {
            return this.props.get(key) ?? null;
        }
        /** Property setter. */
        set(key, val) {
            this.update({ [key]: val });
        }
        /** Update properties. Reserved key:
         * owner: uid of client that controlls the component
        */
        update(items, hook = true) {
            const hooks = [];
            for (const key in items) {
                const oldVal = this.get(key);
                const newVal = items[key] ?? null;
                newVal === null ? this.props.delete(key) : this.props.set(key, newVal);
                const hook = this['$' + key];
                if (typeof hook === 'function') {
                    hooks.push([hook, this, newVal, oldVal]);
                }
            }
            if (hook) {
                for (const [hook, cmp, newVal, oldVal] of hooks) {
                    hook.apply(cmp, [newVal, oldVal]);
                }
            }
            return hooks;
        }
        /** Send result to worker (component must be monitored). */
        yield(result, done = true) {
            if (this.id === null) {
                throw ('element is has no ID');
            }
            this.client.send(this.id, result, done);
        }
        /** Remove element. */
        remove() {
            this.node.remove();
        }
    }
    /** HTMLElement tag  name */
    Component.tag = null;

    class App extends Component {
        constructor() {
            super(...arguments);
            /** Arena component. */
            this.arena = null;
            /** Transition durations. */
            this.css = {};
            /** Stylesheet for theme. */
            this.themeNode = document.createElement('style');
            /** Node for displaying background. */
            this.bgNode = this.ui.createElement('background', this.node);
            /** Node for playing background music. */
            this.bgmNode = document.createElement('audio');
            /** Audio context. */
            this.audio = new (window.AudioContext || window.webkitAudioContext)();
            /** Popup components cleared when arena close. */
            this.popups = new Map();
            /** Count dialog for dialog ID */
            this.dialogCount = 0;
        }
        /** Initialize volume settings. */
        initAudio() {
            // add default settings
            if (this.db.get('game-music') === null) {
                this.db.set('game-music', 'default-game');
            }
            if (this.db.get('splash-music') === null) {
                this.db.set('splash-music', 'default-splash');
            }
            if (this.db.get('music-volume') === null) {
                this.db.set('music-volume', 50);
            }
            if (this.db.get('audio-volume') === null) {
                this.db.set('audio-volume', 50);
            }
            if (this.db.get('theme') === null) {
                this.db.set('theme', 'default');
            }
            // play background music
            const vol = this.db.get('music-volume');
            this.bgmNode.loop = true;
            this.node.appendChild(this.bgmNode);
            const track = this.audio.createMediaElementSource(this.bgmNode);
            const gainNode = this.audio.createGain();
            track.connect(gainNode).connect(this.audio.destination);
            gainNode.gain.value = (vol >= 0 && vol <= 100) ? vol / 100 : 0;
            this.bgmGain = gainNode.gain;
            this.playMusic();
        }
        /** Index assets and load fonts. */
        async initAssets() {
            this.assets = await this.client.readJSON('assets/index.json');
            // add fonts
            for (const font in this.assets['font']) {
                const fontPath = 'assets/font/' + font + '.woff2';
                const fontFace = new window.FontFace(font, `url(${fontPath})`);
                document.fonts.add(fontFace);
                if (font === this.css.app['caption-font']) {
                    fontFace.loaded.then(() => this.splash.node.classList.add('caption-font-loaded'));
                }
                else if (font === this.css.app['label-font']) {
                    fontFace.loaded.then(() => this.splash.node.classList.add('label-font-loaded'));
                }
            }
        }
        async init() {
            document.head.appendChild(this.themeNode);
            // setup triggers
            this.resize();
            window.addEventListener('resize', this.resize.bind(this));
            // this.node.addEventListener('wheel', e => e.preventDefault(), {passive: false}); // prevent two finger swipe gesture in safari
            document.oncontextmenu = () => false;
            document.body.appendChild(this.node);
            // wait for indexedDB
            await this.db.ready;
            this.loadBackground();
            this.initAudio();
            // load styles and fonts
            await this.loadTheme();
            this.splash = this.ui.create('splash');
            await this.splash.gallery.ready;
            this.initAssets();
            // load splash menus
            Promise.all([this.splash.show(), document.fonts.ready]).then(() => {
                this.splash.hub.create(this.splash);
                this.splash.settings.create(this.splash);
            });
            // add history
            if (this.client.platform === 'Android') {
                window.addEventListener('popstate', e => {
                    this.client.triggerListeners('history', e.state);
                });
            }
        }
        /** Add styles for theme. */
        async loadTheme() {
            // name of current theme (or use default value from defaluts.json)
            const name = this.db.get('theme');
            // fetch current and default theme defination
            const currentTheme = await this.client.readJSON('assets/theme', name, 'theme.json');
            const defaultTheme = await this.client.readJSON('assets/theme', 'default', 'theme.json');
            // theme stylesheet
            const sheet = this.themeNode.sheet;
            // get css rules from theme.json (fallback to default any entry not exist)
            let rules = '';
            const addRule = async (entry, prop, name) => {
                // replace relative resource url @(<rel>) with absolute path
                if (prop.indexOf('@(') !== -1) {
                    // parts seperated by @(<rel>)
                    const parts = prop.split('@(');
                    prop = '';
                    // replace url
                    for (const part of parts) {
                        // skip leading @(
                        if (!part)
                            continue;
                        // get relative path from current part
                        const idx = part.indexOf(')');
                        const rel = part.slice(0, idx);
                        prop += `url(assets/theme/${name}/${rel}`;
                        prop += part.slice(idx);
                    }
                }
                rules += `--${entry}: ${prop};`;
                return prop;
            };
            // add rules
            this.css = {};
            for (const section in defaultTheme) {
                this.css[section] = {};
                for (const entry in defaultTheme[section]) {
                    if (currentTheme[section] && currentTheme[section].hasOwnProperty(entry)) {
                        // use the rule of current theme
                        this.css[section][entry] = await addRule(section + '-' + entry, currentTheme[section][entry], name);
                    }
                    else {
                        // fallback to the rule of default theme
                        this.css[section][entry] = await addRule(section + '-' + entry, defaultTheme[section][entry], 'default');
                    }
                }
            }
            // clear the rules of previous theme (if exists)
            while (sheet.rules.length) {
                sheet.deleteRule(0);
            }
            // insert rule
            sheet.insertRule(`noname-app {${rules}}`, sheet.rules.length);
        }
        /** Add styles for background and font. */
        async loadBackground() {
            const bg = this.db.get('bg');
            if (bg) {
                // use custom background
                this.ui.setBackground(this.bgNode, 'assets/bg', bg);
            }
            else {
                // use default background
                this.bgNode.style.background = '';
            }
        }
        /** Play background music. */
        playMusic() {
            const bgm = this.db.get(this.arena ? 'game-music' : 'splash-music');
            if (bgm && bgm !== 'none' && this.db.get('music-volume') > 0) {
                this.bgmNode.src = `assets/bgm/${bgm}.mp3`;
                if (this.audio.state === 'suspended') {
                    const interact = () => {
                        this.audio.resume();
                        if (this.bgmNode.paused && this.db.get('music-volume') > 0) {
                            this.bgmNode.play();
                        }
                        this.node.removeEventListener('pointerup', interact);
                    };
                    this.node.addEventListener('pointerup', interact);
                }
                else {
                    this.bgmNode.play();
                }
            }
            else {
                this.bgmNode.src = '';
            }
        }
        /** Adjust zoom level according to device DPI. */
        resize() {
            // actual window size
            const width = window.innerWidth;
            const height = window.innerHeight;
            // ideal window size
            let [ax, ay] = [960, 540];
            // determine ideal size based on player number
            if (this.arena) {
                [ax, ay] = this.arena.resize(ax, ay, width, height);
            }
            // zoom to fit ideal size
            const zx = width / ax, zy = height / ay;
            let w, h, z;
            if (zx < zy) {
                w = ax;
                h = ax / width * height;
                z = zx;
            }
            else {
                w = ay / height * width;
                h = ay;
                z = zy;
            }
            this.node.style.setProperty('--app-width', w + 'px');
            this.node.style.setProperty('--app-height', h + 'px');
            this.node.style.setProperty('--app-scale', z.toString());
            this.ui.width = w;
            this.ui.height = h;
            this.ui.zoom = z;
            // call listeners
            this.client.triggerListeners('resize');
        }
        /** Get the duration of transition.
         * @param {TransitionDuration} type - transition type
         */
        getTransition(type = null) {
            let key = 'transition';
            if (type && ['fast', 'slow', 'faster', 'slower'].includes(type)) {
                key += '-' + type;
            }
            const duration = parseFloat(this.css.app[key]) || parseFloat(this.css.app.transition);
            return duration * 1000;
        }
        /** Display alert message. */
        async alert(caption, config = {}) {
            config.buttons = [['ok', config.ok ?? '确定', 'red']];
            return await this.choose(caption, config) === 'ok' ? true : null;
        }
        /** Display confirm message. */
        async confirm(caption, config = {}) {
            config.buttons = [['ok', config.ok ?? '确定', 'red'], ['cancel', config.cancel ?? '取消']];
            const result = await this.choose(caption, config);
            if (result === 'ok') {
                return true;
            }
            if (result === 'cancel') {
                return false;
            }
            return null;
        }
        /** Display confirm message. */
        choose(caption, config = {}) {
            const dialog = this.ui.create('dialog');
            dialog.update({ caption, content: config.content, buttons: config.buttons });
            const promise = new Promise(resolve => {
                dialog.onclose = () => {
                    resolve(dialog.result);
                };
                this.popup(dialog, config.id);
            });
            if (config.timeout) {
                return Promise.race([promise, new Promise(resolve => {
                        setTimeout(() => resolve(null), config.timeout * 1000);
                    })]);
            }
            else {
                return promise;
            }
        }
        /** Displa a popup. */
        popup(dialog, id) {
            const dialogID = id ?? ++this.dialogCount;
            this.popups.get(dialogID)?.close();
            const onopen = dialog.onopen;
            const onclose = dialog.onclose;
            // other popups that are blurred by dialog.open()
            const blurred = [];
            dialog.onopen = () => {
                // blur arena, splash and other popups
                this.node.classList.add('popped');
                for (const [id, popup] of this.popups.entries()) {
                    if (!Object.is(popup, dialog) && !popup.node.classList.contains('blurred')) {
                        popup.node.classList.add('blurred');
                        blurred.push(id);
                    }
                }
                if (typeof onopen === 'function') {
                    onopen();
                }
            };
            dialog.onclose = () => {
                // unblur
                this.popups.delete(dialogID);
                if (this.popups.size === 0) {
                    this.node.classList.remove('popped');
                }
                for (const id of blurred) {
                    this.popups.get(id)?.node.classList.remove('blurred');
                }
                blurred.length = 0;
                if (typeof onclose === 'function') {
                    onclose();
                }
            };
            this.popups.set(dialogID, dialog);
            dialog.ready.then(() => dialog.open());
        }
        /** Remove a popup. */
        removePopup(id) {
            const popup = this.popups.get(id);
            popup?.close();
            this.popups.delete(id);
        }
        /** Clear alert and confirm dialogs. */
        clearPopups() {
            for (const popup of this.popups.values()) {
                popup.close();
            }
            this.popups.clear();
        }
    }

    class Collection extends Component {
    }

    class Popup extends Component {
        constructor() {
            super(...arguments);
            /** Main content. */
            this.pane = this.ui.create('pane', this.node);
            /** Trigger when dialog is opened. */
            this.onopen = null;
            /** Trigger when dialog is closed. */
            this.onclose = null;
            /** Whether popup is closed when clicking on background layer. */
            this.temp = true;
            /** Whether popup appears at the center. */
            this.location = null;
            /** Built-in sizes. */
            this.size = null;
            /** Animation speed of open and close. */
            this.transition = null;
            /** Currently hidden. */
            this.hidden = true;
        }
        init() {
            this.node.classList.add('noname-popup');
            // block DOM events behind the pane
            this.ui.bindClick(this.pane.node, () => { });
            // close when clicking on background layer
            this.ui.bindClick(this.node, () => {
                if (this.temp) {
                    this.close();
                }
            });
        }
        close() {
            if (this.hidden) {
                return;
            }
            this.hidden = true;
            if (this.onclose) {
                this.onclose();
            }
            this.ui.animate(this.pane.node, {
                opacity: [1, 0], scale: [1, 'var(--popup-transform)']
            }, this.app.getTransition(this.transition)).onfinish = () => {
                this.node.remove();
            };
        }
        open() {
            if (!this.hidden) {
                return;
            }
            this.hidden = false;
            if (this.location === null) {
                this.node.classList.add('center');
            }
            if (typeof this.size === 'string') {
                this.node.classList.add(this.size);
            }
            this.node.classList.add('hidden');
            this.app.node.appendChild(this.node);
            if (this.location) {
                // determine location of the menu
                if (this.transition === null) {
                    this.transition = 'fast';
                }
                let { x, y } = this.location;
                const rect1 = this.pane.node.getBoundingClientRect();
                const rect2 = this.app.node.getBoundingClientRect();
                const zoom = this.ui.zoom;
                x += 2;
                y -= 2;
                if (x < 10) {
                    x = 10;
                }
                else if (x + rect1.width / zoom + 10 > rect2.width / zoom) {
                    x = rect2.width / zoom - 10 - rect1.width / zoom;
                }
                if (y < 10) {
                    y = 10;
                }
                else if (y + rect1.height / zoom + 10 > rect2.height / zoom) {
                    y = rect2.height / zoom - 10 - rect1.height / zoom;
                }
                this.pane.node.style.left = x + 'px';
                this.pane.node.style.top = y + 'px';
            }
            if (this.onopen) {
                this.onopen();
            }
            this.pane.alignText();
            this.node.classList.remove('hidden');
            this.ui.animate(this.pane.node, {
                opacity: [0, 1], scale: ['var(--popup-transform)', 1]
            }, this.app.getTransition(this.transition));
        }
    }

    class Dialog extends Popup {
        constructor() {
            super(...arguments);
            /** Locate at center. */
            this.center = true;
            /** Don't close when clicking blank area. */
            this.temp = false;
            /** Dialog caption. */
            this.caption = this.pane.addCaption('', true);
            /** Dialog text. */
            this.text = this.pane.addText('');
            /** Dialog buttons. */
            this.buttons = this.pane.add('bar');
            /** Name of the button clicked. */
            this.result = null;
        }
        init() {
            super.init();
            this.pane.width = parseInt(this.app.css.popup['dialog-width']) - 20;
        }
        $caption(val) {
            this.caption.innerHTML = val;
        }
        $content(val) {
            this.text.firstChild.innerHTML = val;
            this.node.classList[val ? 'add' : 'remove']('with-content');
            this.pane.alignText();
        }
        $buttons(buttons) {
            this.buttons.innerHTML = '';
            for (const [id, text, color] of buttons) {
                const button = this.ui.createElement('widget.button');
                if (color) {
                    button.dataset.fill = color;
                }
                button.innerHTML = text;
                this.ui.bindClick(button, () => {
                    this.result = id;
                    this.close();
                });
                this.buttons.appendChild(button);
            }
        }
    }
    /** Use <noname-popup> as tag. */
    Dialog.tag = 'popup';

    class Lobby extends Component {
        constructor() {
            super(...arguments);
            /** Sidebar for configurations. */
            this.sidebar = this.ui.create('sidebar', this.node);
            /** Player seats. */
            this.seats = this.ui.createElement('seats', this.node);
            /** Toggles for mode configuration. */
            this.configToggles = new Map();
            /** Toggles that show or hide based on other toggles. */
            this.configDynamicToggles = new Map();
            /** Toggles for hero packs. */
            this.heroToggles = new Map();
            /** Toggles for card packs. */
            this.cardToggles = new Map();
            /** Trying to connect to server. */
            this.connecting = false;
            /** Trying to exit. */
            this.exiting = false;
            /** Players in this seats. */
            this.players = [];
        }
        init() {
            this.app.arena.node.appendChild(this.node);
            this.client.listeners.sync.add(this);
            this.client.listeners.history.add(this);
            // make android back button function as returning to previous page
            if (this.client.platform === 'Android') {
                history.pushState('lobby', '');
            }
            this.sidebar.ready.then(() => {
                this.sidebar.setHeader('返回', () => {
                    if (history.state === 'lobby') {
                        history.back();
                    }
                    else {
                        this.back();
                    }
                });
                this.sidebar.setFooter('开始游戏', () => this.yield(null));
            });
            this.sidebar.pane.node.classList.add('fixed');
            this.ui.animate(this.sidebar.node, { x: [-220, 0] });
            this.ui.animate(this.seats, { scale: ['var(--app-splash-transform)', 1], opacity: [0, 1] });
        }
        async back() {
            const ws = this.client.connection;
            const peers = this.client.peers;
            if (peers || ws instanceof WebSocket) {
                // history back posponded
                if (this.client.platform === 'Android') {
                    history.forward();
                }
                const content = ws instanceof WebSocket ? '确定退出当前房间？' : '当前房间有其他玩家，退出后将断开连接并请出所有其他玩家，确定退出当前模式？';
                if (!peers || Object.keys(peers).length <= 1 || await this.app.confirm('联机模式', { content, id: 'exitLobby' })) {
                    if (ws instanceof WebSocket) {
                        this.client.clear();
                        ws.send('leave:init');
                    }
                    else {
                        this.freeze();
                        this.yield(['config', 'online', false], false);
                        this.exiting = true;
                    }
                    if (history.state === 'lobby') {
                        this.client.listeners.history.delete(this);
                        history.back();
                    }
                }
            }
            else {
                this.close();
            }
        }
        $pane(configs) {
            this.sidebar.pane.addSection('选项');
            for (const name in configs.configs) {
                const config = configs.configs[name];
                const toggle = this.sidebar.pane.addToggle(config.name, result => {
                    this.freeze();
                    if (name === 'online' && result) {
                        this.connecting = true;
                        this.yield(['config', name, this.client.url], false);
                    }
                    else {
                        this.yield(['config', name, result], false);
                    }
                }, config.options);
                if (config.confirm) {
                    for (const [key, val] of config.confirm) {
                        toggle.confirm.set(key, val);
                    }
                }
                if (config.requires) {
                    this.configDynamicToggles.set(name, config.requires);
                }
                this.configToggles.set(name, toggle);
            }
            this.sidebar.pane.addSection('武将');
            for (const name in configs.heropacks) {
                const toggle = this.sidebar.pane.addToggle(configs.heropacks[name], result => {
                    this.freeze();
                    this.yield(['hero', name, result], false);
                });
                this.heroToggles.set(name, toggle);
            }
            this.sidebar.pane.addSection('卡牌');
            for (const name in configs.cardpacks) {
                const toggle = this.sidebar.pane.addToggle(configs.cardpacks[name], result => {
                    this.freeze();
                    this.yield(['card', name, result], false);
                });
                this.cardToggles.set(name, toggle);
            }
        }
        $owner(uid) {
            this.sidebar.pane.node.classList[uid === this.client.uid ? 'remove' : 'add']('fixed');
            this.sidebar[uid === this.client.uid ? 'showFooter' : 'hideFooter']();
        }
        $config(config) {
            this.unfreeze();
            for (const key in config) {
                const toggle = this.configToggles.get(key);
                toggle?.assign(config[key]);
                const requires = this.configDynamicToggles.get(key);
                if (requires && toggle) {
                    if (requires[0] === '!') {
                        toggle.node.style.display = !config[requires.slice(1)] ? '' : 'none';
                    }
                    else {
                        toggle.node.style.display = config[requires] ? '' : 'none';
                    }
                }
            }
            if (this.owner === this.client.uid) {
                delete config.online;
                this.db.set(this.get('mode') + ':config', config);
            }
        }
        $disabledHeropacks(packs) {
            this.unfreeze();
            for (const [name, toggle] of this.heroToggles.entries()) {
                toggle.assign(!packs.includes(name));
            }
            if (this.owner === this.client.uid) {
                this.db.set(this.get('mode') + ':disabledHeropacks', packs.length > 0 ? packs : null);
            }
        }
        $disabledCardpacks(packs) {
            this.unfreeze();
            for (const [name, toggle] of this.cardToggles.entries()) {
                toggle.assign(!packs.includes(name));
            }
            if (this.owner === this.client.uid) {
                this.db.set(this.get('mode') + ':disabledCardpacks', packs.length > 0 ? packs : null);
            }
        }
        $npmax(npmax) {
            this.seats.innerHTML = '';
            this.players.length = 0;
            for (let i = 0; i < npmax; i++) {
                if (npmax > 4 && i === Math.ceil(npmax / 2)) {
                    this.seats.appendChild(document.createElement('div'));
                }
                const player = this.ui.create('player');
                this.players.push(player);
                this.seats.appendChild(player.node);
            }
        }
        sync() {
            const peers = this.client.peers;
            if (!peers && this.exiting) {
                // room closed successfully
                this.close();
            }
            else if (this.owner === this.client.uid) {
                // callback for online mode toggle
                this.yield(['sync', null, peers ? true : false], false);
                if (this.connecting && !peers) {
                    this.app.alert('连接失败');
                }
                this.connecting = false;
                const toggle = this.configToggles.get('online');
                if (toggle) {
                    if (peers && Object.keys(peers).length > 1) {
                        toggle.confirm.set(false, ['联机模式', '当前房间有其他玩家，关闭后将断开连接并请出所有其他玩家，确定关闭联机模式？']);
                    }
                    else {
                        toggle.confirm.delete(false);
                    }
                }
            }
            // update seats
            const ids = Object.keys(peers || {});
            for (let i = 0; i < this.players.length; i++) {
                if (i < ids.length) {
                    const [nickname, avatar] = peers[ids[i]];
                    this.players[i].set('heroImage', avatar);
                    this.players[i].set('heroName', nickname);
                }
                else {
                    this.players[i].set('heroImage', null);
                    this.players[i].set('heroName', null);
                }
            }
        }
        freeze() {
            this.sidebar.pane.node.classList.add('pending');
        }
        unfreeze() {
            this.sidebar.pane.node.classList.remove('pending');
        }
        close() {
            this.client.disconnect();
            this.ui.animate(this.sidebar.node, { x: [0, -220] }, { fill: 'forwards' });
        }
        async history(state) {
            if (this.client.platform === 'Android' && state !== 'lobby') {
                if (this.app.popups.has('exitLobby')) {
                    this.app.removePopup('exitLobby');
                    history.forward();
                }
                else {
                    this.back();
                }
            }
        }
    }

    class Sidebar extends Component {
        constructor() {
            super(...arguments);
            // header text
            this.header = this.ui.createElement('caption', this.node);
            // pane container
            this.pane = this.ui.create('pane', this.node);
            // pane footer
            this.footer = this.ui.createElement('caption.footer', this.node);
        }
        ;
        init() {
            // header with text and back button
            this.pane.node.classList.add('scrolly');
            this.ui.createElement('span', this.header);
            this.ui.createElement('image', this.header);
            this.ui.createElement('span', this.footer);
        }
        setHeader(caption, onclick) {
            this.ui.bindClick(this.header, onclick);
            this.header.firstChild.innerHTML = caption;
        }
        setFooter(caption, onclick) {
            this.ui.bindClick(this.footer, onclick);
            this.footer.firstChild.innerHTML = caption;
        }
        showFooter() {
            this.node.classList.add('with-footer');
        }
        hideFooter() {
            this.node.classList.remove('with-footer');
        }
    }

    class Arena extends Component {
        constructor() {
            super(...arguments);
            /** Layout mode. */
            this.layout = 0;
            /** Player that is under control. */
            this.viewport = 0;
            /** Card container. */
            this.cards = this.ui.createElement('cards');
            /** Player container. */
            this.players = this.ui.createElement('players');
        }
        init() {
            this.app.arena = this;
            this.app.node.appendChild(this.node);
        }
        /** Update arena layout. */
        resize(ax, ay, width, height) {
            // future: -> app.css['player-width'], etc.
            const np = this.get('np');
            if (np) {
                if (np >= 7 && width / height < (18 + (np - 1) * 168) / 720) {
                    // wide 2-row layout
                    [ax, ay] = [900, 755];
                    this.layout = 1;
                }
                else {
                    // normal 3-row layout
                    if (np === 8) {
                        ax = 1194;
                    }
                    else {
                        ax = 1026;
                    }
                    ay = 620;
                    this.layout = 0;
                }
            }
            return [ax, ay];
        }
        /** Remove arena. */
        remove() {
            this.ui.animate(this.node, {
                opacity: [1, 0]
            }).onfinish = () => {
                super.remove();
            };
        }
        /** Connection status change. */
        $peers() {
            // wait until other properties have been updated
            setTimeout(() => this.client.triggerListeners('sync'));
        }
    }

    class Player extends Component {
        constructor() {
            super(...arguments);
            /** Player background. */
            this.background = this.ui.createElement('background', this.node);
            /** Main hero image. */
            this.heroImage = this.ui.createElement('image', this.background);
            /** Vice hero image. */
            this.viceImage = this.ui.createElement('image.vice', this.background);
            /** Container of name content. */
            this.content = this.ui.createElement('content', this.node);
            /** Main hero name. */
            this.heroName = this.ui.createElement('caption', this.content);
            /** Vice hero name. */
            this.viceName = this.ui.createElement('caption.vice', this.content);
        }
        init() {
            this.node.classList.add('hero-hidden');
            this.node.classList.add('vice-hidden');
        }
        $heroImage(name) {
            if (name) {
                this.node.classList.remove('hero-hidden');
                this.ui.setImage(this.heroImage, name);
            }
            else {
                this.node.classList.add('hero-hidden');
                this.heroImage.style.backgroundImage = '';
            }
        }
        $heroName(name) {
            this.heroName.innerHTML = name ?? '';
        }
    }

    class Button extends Component {
        constructor() {
            super(...arguments);
            // background circle image
            this.background = this.ui.createElement('background', this.node);
            // background colored image
            this.image = this.ui.createElement('image', this.background);
            // text container
            this.content = this.ui.createElement('content', this.node);
        }
        $caption(caption) {
            this.content.innerHTML = '';
            const str1 = this.ui.createElement('caption');
            const str2 = this.ui.createElement('caption');
            str1.innerHTML = caption[0];
            str2.innerHTML = caption[1];
            this.content.appendChild(str1);
            this.content.appendChild(str2);
        }
        $color(color) {
            this.node.dataset.background = color;
        }
    }

    class Gallery extends Component {
        constructor() {
            super(...arguments);
            /** Page container. */
            this.pages = this.ui.createElement('pages', this.node);
            /** Page indicator */
            this.indicator = this.ui.createElement('indicator', this.node);
            /** Number of pages. */
            this.pageCount = 0;
            /** Rendered pages. */
            this.rendered = new Set();
            /** Gallery items. */
            this.items = [];
            /** Index of current page. */
            this.currentPage = -1;
            /** Cache of item number per page. */
            this.currentSize = null;
            /** Device can scroll horizontally. */
            this.horizontal = false;
            /** Target page after multiple wheel input. */
            this.targetPage = null;
            /** Clear target page after 0.5s without input. */
            this.scrollTimeout = 0;
        }
        /** Render page when needed. */
        renderPage(i) {
            const page = this.pages.childNodes[i];
            if (!page || this.rendered.has(i)) {
                return;
            }
            this.rendered.add(i);
            const n = this.getSize();
            const layer = this.ui.createElement('layer');
            for (let j = 0; j < n; j++) {
                const item = this.items[i * n + j];
                if (j && j % this.currentSize[1] === 0) {
                    layer.appendChild(document.createElement('div'));
                }
                if (typeof item === 'function') {
                    const container = this.ui.createElement('item');
                    const rendered = item();
                    if (rendered) {
                        container.appendChild(rendered);
                    }
                    this.items[i * n + j] = container;
                    layer.appendChild(container);
                }
                else if (item) {
                    layer.appendChild(item);
                }
                else {
                    layer.appendChild(this.ui.createElement('item'));
                }
            }
            page.replaceChildren(layer);
        }
        /** Get number of items per page. */
        getSize(recalc = false) {
            if (!recalc && this.currentSize !== null) {
                return this.currentSize[0] * this.currentSize[1];
            }
            const calc = (n, full) => {
                const [ratio, margin, spacing, length] = n;
                return Math.floor((ratio * full - 2 * margin) / (length + spacing * 2));
            };
            const nrows = typeof this.nrows === 'number' ? this.nrows : calc(this.nrows, this.ui.height);
            const ncols = typeof this.ncols === 'number' ? this.ncols : calc(this.ncols, this.ui.width);
            this.currentSize = [nrows, ncols];
            return nrows * ncols;
        }
        /** Update page count and create page(s) if necessary. */
        updatePages() {
            const pageCount = Math.ceil(this.items.length / this.getSize());
            // add more pages
            while (pageCount > this.pageCount) {
                this.pages.appendChild(this.ui.createElement('page'));
                const dot = this.ui.createElement('dot', this.indicator);
                if (pageCount === 1) {
                    dot.classList.add('current');
                }
                this.ui.createElement('layer', dot);
                this.ui.createElement('layer', dot);
                this.pageCount++;
            }
            // remove extra pages
            while (pageCount < this.pageCount) {
                this.pages.lastChild.remove();
                this.indicator.lastChild.remove();
                this.pageCount--;
            }
            // show or hide page indicator
            this.node.classList[this.pageCount > 1 ? 'add' : 'remove']('with-indicator');
        }
        init() {
            // enable horizontal scroll
            this.pages.classList.add('scrollx');
            this.node.addEventListener('wheel', e => this.wheel(e), { passive: true });
            // render and update page indicator while scrolling
            this.pages.addEventListener('scroll', () => {
                this.checkPage();
                if (this.targetPage && this.targetPage[0] !== this.targetPage[1]) {
                    const left = this.pages.scrollLeft;
                    const width = this.pages.offsetWidth;
                    const vel1 = this.targetPage[0] * width - left;
                    const vel2 = this.targetPage[1] * width - left;
                    // change scrollTo target only if direction changed or scroll speed increased by 1.5x
                    // (in order to avoid unsmooth speed variation)
                    if (vel1 * vel2 < 0 || Math.abs(vel2 / vel1) > 1.5) {
                        this.targetPage[0] = this.targetPage[1];
                        this.pages.scrollTo({ left: this.targetPage[1] * width, behavior: 'smooth' });
                    }
                }
            }, { passive: true });
            // add callbacks for dynamic item number
            if (Array.isArray(this.nrows)) {
                this.node.classList.add('centery');
                this.client.listeners.resize.add(this);
            }
            if (Array.isArray(this.ncols)) {
                this.node.classList.add('centerx');
                this.client.listeners.resize.add(this);
            }
        }
        /** Enable horizontal scroll with mouse wheel. */
        wheel(e) {
            // disable this function if device can scroll horizontally
            if (e.deltaX !== 0) {
                this.horizontal = true;
                this.targetPage = null;
            }
            if (this.horizontal) {
                return;
            }
            // reset timeout
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = window.setTimeout(() => {
                if (this.targetPage) {
                    if (this.currentPage !== this.targetPage[1]) {
                        this.pages.scrollTo({ left: this.targetPage[1] * this.pages.offsetWidth, behavior: 'smooth' });
                    }
                    this.targetPage = null;
                }
            }, 500);
            // turn page (used with scroll-snapping and scroll-behavior: smooth)
            const width = this.pages.offsetWidth;
            let targetPage = this.targetPage ? this.targetPage[1] : Math.round(this.pages.scrollLeft / width);
            targetPage += e.deltaY / Math.abs(e.deltaY);
            if (targetPage < 0) {
                targetPage = 0;
                if (targetPage === this.currentPage) {
                    return;
                }
            }
            else if (targetPage >= this.pageCount) {
                targetPage = this.pageCount - 1;
                if (targetPage === this.currentPage) {
                    return;
                }
            }
            if (!this.targetPage) {
                this.targetPage = [targetPage, targetPage];
                this.pages.scrollTo({ left: targetPage * width, behavior: 'smooth' });
            }
            else {
                this.targetPage[1] = targetPage;
            }
        }
        /** Add an item or an item constructor. */
        add(item) {
            // wrap item with container
            if (typeof item === 'function') {
                this.items.push(item);
            }
            else {
                const container = this.ui.createElement('item');
                container.appendChild(item);
                this.items.push(container);
            }
            // re-render current page
            this.updatePages();
            this.rendered.delete(this.pageCount - 1);
        }
        /** Update current page after reopening. */
        checkPage() {
            const page = Math.round(this.pages.scrollLeft / this.node.offsetWidth);
            if (page !== this.currentPage) {
                this.turnPage(page);
            }
        }
        /** Update indicator and render nearby pages. */
        turnPage(page) {
            if (page >= this.pageCount || page < 0) {
                return;
            }
            // update current page
            this.currentPage = page;
            if (this.targetPage && page === this.targetPage[1]) {
                this.targetPage = null;
            }
            // create current and sibling pages
            this.renderPage(page);
            this.renderPage(page + 1);
            this.renderPage(page - 1);
            // update page indicator
            this.indicator.querySelector('.current')?.classList.remove('current');
            this.indicator.childNodes[page].classList.add('current');
        }
        /** Callback when window resize. */
        resize() {
            if (!this.currentSize) {
                this.getSize();
            }
            const [nrows, ncols] = this.currentSize;
            this.getSize(true);
            if (nrows !== this.currentSize[0] || ncols !== this.currentSize[1]) {
                this.rendered.clear();
                this.updatePages();
                if (this.currentPage >= this.pageCount) {
                    this.currentPage = this.pageCount - 1;
                }
                this.turnPage(this.currentPage);
            }
        }
    }

    class Input extends Component {
        constructor() {
            super(...arguments);
            // icon in <input>
            this.icon = this.ui.createElement('icon');
            // callback when blur or pressed enter
            this.callback = null;
            // callback when clicking icon
            this.onicon = null;
        }
        init() {
            this.input = document.createElement('input');
            this.node.appendChild(this.input);
            this.node.appendChild(this.icon);
            this.input.onfocus = () => {
                if (!this.input.disabled && this.input.value.length) {
                    this.input.setSelectionRange(0, this.input.value.length);
                }
            };
            this.input.onblur = async () => {
                if (this.callback && !this.input.disabled) {
                    getSelection()?.removeAllRanges();
                    this.input.disabled = true;
                    await this.callback(this.input.value);
                    this.input.disabled = false;
                }
            };
            this.input.onkeyup = e => {
                if (e.key === 'Enter') {
                    this.input.blur();
                }
            };
            this.input.ontouchstart = () => {
                if (this.input.disabled) {
                    return;
                }
                const val = this.input.value;
                this.input.disabled = true;
                this.input.value = prompt('', this.input.value) || val;
                Promise.all([
                    new Promise(resolve => setTimeout(resolve, 100)),
                    new Promise(async (resolve) => {
                        if (this.callback) {
                            await this.callback(this.input.value);
                        }
                        resolve();
                    })
                ]).then(() => this.input.disabled = false);
            };
            this.ui.bindClick(this.icon, e => {
                if (this.onicon) {
                    this.onicon(e);
                }
            });
        }
        $icon(name) {
            if (name) {
                this.node.classList.add('with-icon');
                this.icon.style.backgroundImage = `var(--icon-${name})`;
            }
            else {
                this.node.classList.remove('with-icon');
            }
        }
    }

    class Pane extends Component {
        constructor() {
            super(...arguments);
            /** Pane width for text alignment. */
            this.width = null;
        }
        /** Section title. */
        addSection(content) {
            const node = this.ui.createElement('section', this.node);
            this.ui.createElement('span', node).innerHTML = content;
            return node;
        }
        /** Caption text. */
        addCaption(content, large = false) {
            const node = this.ui.createElement('caption', this.node);
            if (large) {
                node.classList.add('large');
            }
            node.innerHTML = content;
            return node;
        }
        /** Caption text. */
        addText(content) {
            const node = this.ui.createElement('text', this.node);
            this.ui.createElement('span', node).innerHTML = content;
            return node;
        }
        /** Add a group of custom elements. */
        add(tag) {
            return this.ui.createElement(tag, this.node);
        }
        /** Gallery of selectable items. */
        addGallery(nrows, ncols) {
            const gallery = this.ui.create('gallery');
            gallery.nrows = nrows;
            gallery.ncols = ncols;
            this.node.appendChild(gallery.node);
            return gallery;
        }
        /** Add context menu item. */
        addOption(caption, onclick) {
            this.node.classList.add('menu');
            const option = this.ui.createElement('option');
            option.innerHTML = caption;
            this.ui.bindClick(option, onclick);
            this.node.appendChild(option);
            return option;
        }
        /** Add a toggle. */
        addToggle(caption, onclick, choices) {
            const toggle = this.ui.create('toggle');
            toggle.setup(caption, onclick, choices);
            this.node.appendChild(toggle.node);
            return toggle;
        }
        /** Align text nodes to center. */
        alignText() {
            for (const span of this.node.querySelectorAll('noname-pane > noname-text > noname-span')) {
                const dx = (this.width - span.offsetWidth) / 2;
                span.parentNode.style.transform = `translateX(${dx}px)`;
            }
        }
    }

    class SplashBar extends Component {
        constructor() {
            super(...arguments);
            this.buttons = {
                /** Clear cached files and reload. */
                reset: this.ui.create('button'),
                /** Refresh page. */
                refresh: this.ui.create('button'),
                /** Workshop button. */
                workshop: this.ui.create('button'),
                /** Hub button. */
                hub: this.ui.create('button'),
                /** Settings button. */
                settings: this.ui.create('button')
            };
        }
        init() {
            // update button styles
            const buttons = [
                ['reset', '重置', 'red'],
                ['refresh', '刷新', 'purple'],
                ['workshop', '扩展', 'yellow'],
                ['hub', '联机', 'green'],
                ['settings', '选项', 'orange']
            ];
            for (const [name, caption, color] of buttons) {
                const button = this.buttons[name];
                button.update({ caption, color });
                this.ui.bindClick(button.node, () => this[name]());
                button.node.classList.add('disabled');
                this.node.appendChild(button.node);
            }
            // hide reset button outside dev mode
            if (!this.client.debug) {
                this.buttons.reset.node.style.display = 'none';
                this.buttons.refresh.node.style.display = 'none';
            }
            else {
                this.buttons.reset.node.classList.remove('disabled');
                this.buttons.refresh.node.classList.remove('disabled');
                if (['iOS', 'Android'].includes(this.client.platform)) {
                    this.buttons.refresh.node.style.display = '';
                }
                else {
                    this.buttons.refresh.node.style.display = 'none';
                }
            }
        }
        async reset() {
            this.app.node.style.opacity = '0.5';
            if (window['caches']) {
                await window['caches'].delete(this.client.version);
            }
            for (const file of await this.db.readdir()) {
                if (file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.css')) {
                    await this.db.writeFile(file, null);
                }
            }
            window.location.reload();
        }
        refresh() {
            window.location.reload();
        }
        workshop() {
        }
        hub() {
            this.splash?.hub.open();
        }
        settings() {
            this.splash?.settings.open();
        }
    }
    /** Use tag <noname-bar>. */
    SplashBar.tag = 'bar';

    class SplashGallery extends Gallery {
        constructor() {
            super(...arguments);
            /** Gallery has no boundary. */
            this.overflow = true;
            /** Single row. */
            this.nrows = 1;
            /** Default window width. */
            this.width = 900;
        }
        async init() {
            const margin = parseInt(this.app.css.app['splash-margin']);
            this.ncols = [1, margin * 2, margin, parseInt(this.app.css.player.width)];
            super.init();
            // get modes
            this.index = await this.db.readFile('extensions/index.json') || {};
            const extensions = await this.client.readJSON('extensions/extensions.json');
            const modes = [];
            // udpate index.json
            let write = false;
            for (const name of extensions) {
                if (!this.index[name]) {
                    await this.loadExtension(name);
                    if (this.index[name]) {
                        write = true;
                    }
                }
                if (this.index[name]?.mode) {
                    this.index[name].mode;
                    modes.push(name);
                }
            }
            if (write) {
                await this.db.writeFile('extensions/index.json', this.index);
            }
            for (const name of modes) {
                this.add(() => this.addMode(name));
            }
        }
        async loadExtension(name) {
            if (!this.index[name]) {
                try {
                    const idx = {};
                    const ext = (await import(`../extensions/${name}/main.js`)).default;
                    if (ext.heropack || ext.cardpack) {
                        idx.pack = true;
                    }
                    if (ext.mode?.name) {
                        idx.mode = ext.mode.name;
                    }
                    if (ext.tags) {
                        idx.tags = ext.tags;
                    }
                    if (ext.hero) {
                        idx.images = Object.keys(ext.hero);
                    }
                    this.index[name] = idx;
                }
                catch (e) {
                    console.log(e, name);
                }
            }
        }
        addMode(mode) {
            const ui = this.ui;
            const entry = ui.createElement('widget');
            const name = this.index[mode].mode;
            // set mode backgrround
            const bg = ui.createElement('image', entry);
            ui.setBackground(bg, 'extensions', mode, 'mode');
            // set caption
            const caption = ui.createElement('caption', entry);
            caption.innerHTML = name;
            // bind click
            ui.bindClick(entry, () => {
                const packs = [];
                for (const name in this.index) {
                    let add = true;
                    if (!this.index[name].pack) {
                        continue;
                    }
                    if (this.index[mode].tags) {
                        for (const tag of this.index[mode].tags) {
                            if (tag[tag.length - 1] === '!') {
                                if (!(this.index[name].tags?.includes(tag))) {
                                    add = false;
                                    break;
                                }
                            }
                        }
                    }
                    if (add && this.index[name].tags) {
                        for (const tag of this.index[name].tags) {
                            if (tag[tag.length - 1] === '!') {
                                if (!(this.index[mode].tags?.includes(tag))) {
                                    add = false;
                                    break;
                                }
                            }
                        }
                    }
                    if (add) {
                        packs.push(name);
                    }
                }
                this.client.connect([mode, packs]);
                this.splash.hide();
            });
            return entry;
        }
    }
    /** Use tag <noname-gallery>. */
    SplashGallery.tag = 'gallery';

    const version = '2.0.0dev1';
    const config = {
        "ws": "ws.noname.pub:8080",
        "nickname": "无名玩家",
        "avatar": "standard:caocao"
    };

    /** Commands received from Owner.
     * edit: Create or edit room.
     * kick: Remove a client from room.
     * to: Send a message to a client in the room.
     * bcast: Send a message to all clients in the room.
     */
    /** Commands sent to Member.
     * down: Owner lost connection.
     * msg: Owner sends a UITick.
     * edit: Room info changes (for idle clients).
     * num: Number of connected clients (for idle clients).
     * reload: Full list of rooms.
    */
    const hub2member = ['down', 'msg', 'edit', 'reload', 'num'];
    /** Split message. */
    function split(msg) {
        const idx = msg.indexOf(':');
        if (idx === -1) {
            return [msg, ''];
        }
        else {
            return [msg.slice(0, idx), msg.slice(idx + 1)];
        }
    }

    class SplashHub extends Popup {
        constructor() {
            super(...arguments);
            /** Portrait sized popup. */
            this.size = 'portrait';
            /** Room widgets. */
            this.rooms = new Map();
            /** Room widget container. */
            this.roomGroup = this.ui.createElement('rooms.hidden');
            /** Caption container. */
            this.caption = this.ui.createElement('caption.hidden');
            /** nickname input */
            this.nickname = this.ui.create('input');
            /** address input */
            this.address = this.ui.create('input');
            /** Popup for avatar selection. */
            this.avatarSelector = null;
        }
        create(splash) {
            // nickname, avatar and this address
            this.addInfo();
            // room list in this menu
            this.numSection = this.pane.addSection('');
            this.numSection.classList.add('hidden');
            this.pane.node.appendChild(this.roomGroup);
            this.roomGroup.classList.add('scrolly');
            // caption message in this menu
            this.pane.node.appendChild(this.caption);
            // popup open and close
            this.onopen = () => {
                splash.node.classList.add('blurred');
                this.address.input.disabled = true;
                setTimeout(async () => {
                    if (!this.client.connection) {
                        await this.connect();
                        this.address.input.disabled = false;
                    }
                }, 500);
            };
            this.onclose = () => {
                splash.node.classList.remove('blurred');
            };
            // enable button click after creation finish
            splash.bar.buttons.hub.node.classList.remove('disabled');
            this.gallery = splash.gallery;
        }
        clearRooms() {
            for (const room of this.rooms.values()) {
                room.remove();
            }
            this.rooms.clear();
        }
        setCaption(caption) {
            this.numSection.classList.add('hidden');
            this.roomGroup.classList.add('hidden');
            if (caption) {
                this.caption.innerHTML = caption;
            }
            this.caption.classList[caption ? 'remove' : 'add']('hidden');
        }
        connect() {
            try {
                if (!this.address.input.value) {
                    this.client.db.set('ws', null);
                    return;
                }
                this.client.connect('wss://' + this.address.input.value);
                this.address.set('icon', 'clear');
                const ws = this.client.connection;
                this.setCaption('正在连接');
                return new Promise(resolve => {
                    this.address.onicon = () => {
                        ws.close();
                    };
                    ws.onclose = () => {
                        this.disconnect(this.client.connection === ws);
                        setTimeout(resolve, 100);
                    };
                    ws.onopen = () => {
                        this.address.set('icon', 'ok');
                        this.setCaption('');
                        ws.send('init:' + JSON.stringify([this.client.uid, this.client.info]));
                        if (this.address.input.value !== config.ws) {
                            this.client.db.set('ws', this.address.input.value);
                        }
                    };
                    ws.onmessage = ({ data }) => {
                        try {
                            const [method, arg] = split(data);
                            if (hub2member.includes(method)) {
                                this[method](arg);
                            }
                        }
                        catch (e) {
                            console.log(e);
                            ws.close();
                        }
                    };
                });
            }
            catch (e) {
                console.log(e);
                this.disconnect(true);
            }
        }
        disconnect(client) {
            if (client) {
                this.client.disconnect();
            }
            this.clearRooms();
            this.address.set('icon', null);
            this.address.onicon = null;
            this.setCaption('已断开');
        }
        addInfo() {
            const group = this.pane.add('group');
            // avatar
            const avatarNode = this.ui.createElement('widget', group);
            const img = this.avatarImage = this.ui.createElement('image', avatarNode);
            const url = this.db.get('avatar') ?? config.avatar;
            this.ui.setImage(img, url);
            this.ui.bindClick(avatarNode, e => {
                if (!this.avatarSelector) {
                    this.createSelector();
                }
                this.avatarSelector.open();
            });
            // nickname input
            this.ui.createElement('span.nickname', group).innerHTML = '昵称';
            const nickname = this.nickname = this.ui.create('input', group);
            nickname.node.classList.add('nickname');
            nickname.ready.then(() => {
                nickname.input.value = this.db.get('nickname') || config.nickname;
            });
            nickname.callback = async (val) => {
                if (val) {
                    this.db.set('nickname', val);
                    nickname.set('icon', 'emote');
                    await new Promise(resolve => setTimeout(resolve, this.app.getTransition('slow')));
                    nickname.set('icon', null);
                    this.sendInfo();
                }
            };
            // address input
            this.ui.createElement('span.address', group).innerHTML = '地址';
            const address = this.address = this.ui.create('input', group);
            address.node.classList.add('address');
            address.ready.then(() => {
                address.input.value = this.client.url;
            });
            address.callback = () => this.connect();
        }
        async reload(msg) {
            const [reason, content] = split(msg);
            if (reason === 'kick') {
                await this.app.alert('你被请出了房间');
            }
            else if (reason === 'end') {
                await this.app.alert('房间已关闭');
            }
            this.app.splash.show();
            this.roomGroup.classList.remove('entering');
            this.clearRooms();
            this.client.clear();
            this.roomGroup.classList.remove('hidden');
            this.edit(content);
        }
        edit(msg) {
            const ws = this.client.connection;
            if (!(ws instanceof WebSocket)) {
                return;
            }
            const rooms = JSON.parse(msg);
            for (const uid in rooms) {
                this.rooms.get(uid)?.remove();
                if (rooms[uid] !== 'close') {
                    try {
                        const room = this.ui.create('splash-room');
                        room.setup(JSON.parse(rooms[uid]));
                        this.rooms.set(uid, room);
                        this.ui.bindClick(room.node, () => {
                            if (!this.roomGroup.classList.contains('entering')) {
                                this.roomGroup.classList.add('entering');
                                ws.send('join:' + uid);
                            }
                        });
                        this.roomGroup.appendChild(room.node);
                    }
                    catch (e) {
                        console.log(e);
                        this.rooms.delete(uid);
                    }
                }
                else {
                    this.rooms.delete(uid);
                }
            }
        }
        num(msg) {
            this.numSection.classList.remove('hidden');
            this.numSection.firstChild.innerHTML = '在线：' + msg;
        }
        msg(msg) {
            this.client.tick(JSON.parse(msg));
            this.app.splash.hide();
            this.close();
        }
        down(msg) {
            // room owner disconnected
            const ws = this.client.connection;
            const promise = this.app.alert('房主连接断开', { ok: '退出房间', id: 'down' });
            const dialog = this.app.popups.get('down');
            const update = () => {
                const remaining = Math.max(0, Math.round((parseInt(msg) - Date.now()) / 1000));
                dialog.set('content', `如果房主无法在<span class="mono">${remaining}</span>秒内重新连接，房间将自动关闭。`);
            };
            update();
            const interval = setInterval(update, 1000);
            promise.then(val => {
                clearInterval(interval);
                if (val === true && Object.is(ws, this.client.connection) && ws instanceof WebSocket) {
                    ws.send('leave:init');
                }
            });
        }
        sendInfo() {
            if (this.client.connection instanceof WebSocket) {
                this.client.connection.send('set:' + JSON.stringify(this.client.info));
            }
        }
        createSelector() {
            const popup = this.avatarSelector = this.ui.create('popup');
            popup.node.classList.add('splash-avatar');
            popup.onopen = () => {
                this.node.classList.add('blurred');
                gallery.checkPage();
            };
            popup.onclose = () => {
                this.node.classList.remove('blurred');
            };
            const images = [];
            for (const name in this.gallery.index) {
                const ext = this.gallery.index[name];
                if (ext.images) {
                    for (const img of ext.images) {
                        images.push(name + ':' + img);
                    }
                }
            }
            const gallery = popup.pane.addGallery(5, 9);
            for (const img of images) {
                gallery.add(() => {
                    const node = this.ui.createElement('image');
                    this.ui.setImage(node, img);
                    this.ui.bindClick(node, () => {
                        this.ui.setImage(this.avatarImage, img);
                        this.db.set('avatar', img);
                        this.sendInfo();
                        popup.close();
                    });
                    return node;
                });
            }
        }
    }
    /** Use tag <noname-popup>. */
    SplashHub.tag = 'popup';

    class SplashRoom extends Component {
        constructor() {
            super(...arguments);
            /** Avatar image. */
            this.avatar = this.ui.createElement('image', this.node);
            /** Mode name. */
            this.caption = this.ui.createElement('caption', this.node);
            /** Status text. */
            this.status = this.ui.createElement('span', this.node);
            /** Nickname text. */
            this.nickname = this.ui.createElement('span.nickname', this.node);
        }
        setup([name, np, npmax, [nickname, avatar], state]) {
            this.ui.setImage(this.avatar, avatar);
            this.caption.innerHTML = name;
            const stateText = state ? '游戏中' : '等待中';
            this.status.innerHTML = `<noname-status data-state="${state}"></noname-status> ${stateText} ${Math.min(np, npmax)} / ${npmax}`;
            this.nickname.innerHTML = `<noname-image></noname-image>${nickname}`;
        }
    }
    /** Use <noname-widget> as tag */
    SplashRoom.tag = 'widget';

    class SplashSettings extends Popup {
        constructor() {
            super(...arguments);
            /** Portrait sized popup. */
            this.size = 'portrait';
            /** Currently rotating music nodes. */
            this.rotating = null;
            /** Animation of this.rotating. */
            this.rotatingAnimation = null;
            /** Gallery column number. */
            this.ncols = 3;
            /** All galleries. */
            this.galleries = new Set();
        }
        create(splash) {
            this.onopen = () => {
                for (const gallery of this.galleries) {
                    gallery.checkPage();
                }
                splash.node.classList.add('blurred');
                if (this.rotating) {
                    this.rotate(this.rotating);
                }
            };
            this.onclose = () => {
                splash.node.classList.remove('blurred');
                this.rotatingAnimation?.pause();
            };
            this.addThemes();
            this.addBackgrounds();
            this.addMusic();
            // enable button click after creation finish
            splash.bar.buttons.settings.node.classList.remove('disabled');
        }
        rotate(node) {
            if (this.rotating !== node) {
                this.rotatingAnimation?.pause();
            }
            const animation = this.rotating === node ? this.rotatingAnimation : node.getAnimations()[0];
            this.rotating = node;
            if (animation) {
                this.rotatingAnimation = animation;
                animation.play();
            }
            else {
                this.rotatingAnimation = node.animate([
                    { transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }
                ], {
                    duration: 10000,
                    iterations: Infinity
                });
            }
        }
        addThemes() {
            this.pane.addSection('主题');
            const themes = Array.from(Object.keys(this.app.assets.theme));
            const themeGallery = this.pane.addGallery(1, this.ncols);
            this.galleries.add(themeGallery);
            for (const theme of themes) {
                themeGallery.add(() => {
                    const node = this.ui.createElement('widget.sharp');
                    this.ui.setBackground(this.ui.createElement('image', node), `assets/theme/${theme}/theme`);
                    if (theme === this.db.get('theme')) {
                        node.classList.add('active');
                    }
                    this.ui.bindClick(node, () => {
                        if (theme !== this.db.get('theme')) {
                            node.parentNode?.parentNode?.parentNode?.parentNode?.querySelector('noname-widget.active')?.classList.remove('active');
                            node.classList.add('active');
                            this.db.set('theme', theme);
                            this.app.loadTheme();
                        }
                    });
                    return node;
                });
            }
            themeGallery.add(() => {
                const node = this.ui.createElement('widget.sharp');
                const content = this.ui.createElement('content', node);
                this.ui.createElement('caption', content).innerHTML = '⊕ 创建主题';
                return node;
            });
        }
        addBackgrounds() {
            this.pane.addSection('背景');
            const bgs = Array.from(Object.keys(this.app.assets.bg));
            const bgGallery = this.pane.addGallery(1, this.ncols);
            this.galleries.add(bgGallery);
            for (const bg of bgs) {
                bgGallery.add(() => {
                    const node = this.ui.createElement('widget.sharp');
                    this.ui.setBackground(this.ui.createElement('image', node), 'assets/bg/', bg);
                    if (bg === this.db.get('bg')) {
                        node.classList.add('active');
                    }
                    this.ui.bindClick(node, () => {
                        if (bg !== this.db.get('bg')) {
                            node.parentNode?.parentNode?.parentNode?.parentNode?.querySelector('noname-widget.active')?.classList.remove('active');
                            node.classList.add('active');
                            this.db.set('bg', bg);
                            this.app.loadBackground();
                        }
                        else {
                            node.classList.remove('active');
                            this.db.set('bg', null);
                            this.app.loadBackground();
                        }
                    });
                    return node;
                });
            }
            bgGallery.add(() => {
                const node = this.ui.createElement('widget.sharp');
                const content = this.ui.createElement('content', node);
                this.ui.createElement('caption', content).innerHTML = '⊕ 添加背景';
                return node;
            });
        }
        addMusic() {
            this.pane.addSection('音乐');
            const volGallery = this.pane.addGallery(1, 2);
            volGallery.node.classList.add('volume');
            volGallery.add(this.createSlider('音乐音量：', 'music-volume'));
            volGallery.add(this.createSlider('音效音量：', 'audio-volume'));
            this.galleries.add(volGallery);
            const bgms = Array.from(Object.keys(this.app.assets.bgm));
            const bgmGallery = this.pane.addGallery(1, this.ncols * 2);
            bgmGallery.node.classList.add('music');
            this.galleries.add(bgmGallery);
            for (const bgm of bgms) {
                bgmGallery.add(() => {
                    const node = this.ui.createElement('widget.sharp');
                    this.ui.setBackground(this.ui.createElement('image', node), 'assets/bgm', bgm);
                    if (bgm === this.db.get('splash-music')) {
                        this.rotating = node;
                    }
                    if (bgm === this.db.get('game-music')) {
                        node.classList.add('active');
                    }
                    this.ui.bindClick(node, e => this.musicMenu(node, bgm, e));
                    return node;
                });
            }
            bgmGallery.add(() => {
                const node = this.ui.createElement('widget.sharp');
                const content = this.ui.createElement('content.plus', node);
                this.ui.createElement('caption', content).innerHTML = '+';
                return node;
            });
        }
        createSlider(caption, key) {
            const node = this.ui.createElement('widget.sharp');
            const img = this.ui.createElement('image', node);
            const slider = this.ui.createElement('slider', img);
            this.ui.createElement('div', slider);
            this.ui.createElement('div', slider);
            const content = this.ui.createElement('content', node);
            const text = this.ui.createElement('text', content);
            text.innerHTML = caption + '<div>' + this.db.get(key) + '</div>';
            const updatetVolume = (vol) => {
                let offset = -(100 - vol) / 100 * width;
                if (vol === 0) {
                    offset -= 1;
                }
                this.ui.dispatchMove(slider, { x: offset ?? -width, y: 0 });
            };
            const width = 180 - 2 * parseFloat(this.app.css.widget['image-margin-sharp']);
            this.ui.bindMove(slider, {
                movable: { x: [-width - 1, 0], y: [0, 0] },
                onmove: ({ x }) => {
                    const vol = Math.max(0, 100 - Math.round(-x * 100 / width));
                    text.innerHTML = caption + '<div>' + vol + '</div>';
                    this.db.set(key, vol);
                    if (key === 'music-volume') {
                        this.app.bgmGain.value = vol / 100;
                        if (vol && this.app.bgmNode.paused) {
                            setTimeout(() => this.app.playMusic());
                        }
                        else if (vol == 0) {
                            this.app.bgmNode.pause();
                        }
                    }
                }
            });
            node.addEventListener('wheel', e => {
                const vol = this.db.get(key);
                const direction = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                if (direction < 0 && vol < 100) {
                    updatetVolume(vol + 1);
                }
                else if (direction > 0 && vol > 0) {
                    updatetVolume(vol - 1);
                }
            }, { passive: true });
            updatetVolume(this.db.get(key));
            return node;
        }
        musicMenu(node, bgm, e) {
            const rotating_bak = [this.rotating, this.rotatingAnimation];
            this.app.bgmNode.src = `assets/bgm/${bgm}.mp3`;
            this.app.bgmNode.play();
            const menu = this.ui.create('popup');
            this.rotate(node);
            const restore = () => {
                if (rotating_bak[0] && rotating_bak[0] !== node) {
                    this.rotating = rotating_bak[0];
                    this.rotatingAnimation = rotating_bak[1];
                    if (this.rotatingAnimation) {
                        this.rotatingAnimation.play();
                    }
                    else {
                        this.rotate(this.rotating);
                    }
                }
                this.app.playMusic();
            };
            menu.pane.addOption('等待音乐', () => {
                this.rotateMusic(node, bgm, true, false);
                menu.onclose = null;
                menu.close();
            });
            menu.pane.addOption('游戏音乐', () => {
                this.rotateMusic(node, bgm, false, true);
                restore();
                menu.onclose = null;
                menu.close();
            });
            menu.pane.addOption('全部应用', () => {
                this.rotateMusic(node, bgm, true, true);
                menu.onclose = null;
                menu.close();
            });
            menu.onclose = () => {
                this.rotateMusic(node, bgm, false, false);
                restore();
            };
            menu.location = e;
            menu.open();
        }
        rotateMusic(node, bgm, splash, game) {
            if (splash) {
                this.rotate(node);
                this.db.set('splash-music', bgm);
            }
            else {
                if (this.rotating === node) {
                    this.rotatingAnimation?.pause();
                    this.rotating = null;
                    this.rotatingAnimation = null;
                }
                if (this.db.get('splash-music') === bgm) {
                    this.db.set('splash-music', 'none');
                }
            }
            if (game) {
                node.parentNode?.parentNode?.parentNode?.parentNode?.querySelector('noname-widget.active')?.classList.remove('active');
                node.classList.add('active');
                this.db.set('game-music', bgm);
            }
            else {
                node.classList.remove('active');
                if (this.db.get('game-music') === bgm) {
                    this.db.set('game-music', 'none');
                }
            }
        }
    }
    /** Use tag <noname-popup>. */
    SplashSettings.tag = 'popup';

    class Splash extends Component {
        constructor() {
            super(...arguments);
            // gallery of modes
            this.gallery = this.ui.create('splash-gallery');
            // bottom toolbar
            this.bar = this.ui.create('splash-bar');
            // settings menu
            this.settings = this.ui.create('splash-settings');
            // hub menu
            this.hub = this.ui.create('splash-hub');
            // currently hidden
            this.hidden = true;
        }
        init() {
            // create mode selection gallery
            this.gallery.splash = this;
            this.node.appendChild(this.gallery.node);
            // bottom button bar
            this.bar.splash = this;
            this.node.appendChild(this.bar.node);
            // debug mode
            if (this.client.debug && ['iOS', 'Android'].includes(this.client.platform)) {
                const script = document.createElement('script');
                script.src = 'lib/eruda/eruda.js';
                script.onload = () => window.eruda.init();
                document.head.appendChild(script);
            }
        }
        hide() {
            if (this.hidden) {
                return;
            }
            this.hidden = true;
            this.ui.animate(this.node, {
                scale: [1, 'var(--app-splash-transform)'], opacity: [1, 0]
            }).onfinish = () => {
                this.node.remove();
            };
        }
        show() {
            if (!this.hidden) {
                return;
            }
            this.hidden = false;
            this.app.node.appendChild(this.node);
            this.gallery.checkPage();
            return new Promise(resolve => {
                this.ui.animate(this.node, {
                    scale: ['var(--app-splash-transform)', 1], opacity: [0, 1]
                }).onfinish = resolve;
            });
        }
    }

    class Toggle extends Component {
        constructor() {
            super(...arguments);
            /** Caption text. */
            this.span = this.ui.createElement('span', this.node);
            /** Disabled choices. */
            this.disabledChoices = new Set();
            /** Requires confirmation when toggling to a value. */
            this.confirm = new Map();
        }
        setup(caption, onclick, choices) {
            this.span.innerHTML = caption;
            if (choices) {
                // menu based switcher
                const popup = this.ui.createElement('text', this.node);
                this.text = this.ui.createElement('span', popup);
                this.ui.createElement('bar', popup);
                this.ui.bindClick(popup, () => {
                    // open context menu
                    const rect = popup.getBoundingClientRect();
                    const menu = this.ui.create('popup');
                    for (const [id, name] of choices) {
                        menu.pane.addOption(name, async () => {
                            if (this.confirm.has(id)) {
                                const [title, content] = this.confirm.get(id);
                                if (!await this.app.confirm(title ?? '确定将' + caption + '设为' + name + '？', { content })) {
                                    return;
                                }
                            }
                            onclick(id);
                            menu.close();
                        });
                    }
                    menu.location = { x: (rect.left + rect.width) / this.ui.zoom + 3, y: rect.top / this.ui.zoom - 3 };
                    menu.open();
                });
                // save captions corresponding to option values
                this.choices = new Map(choices);
            }
            else {
                // boolean switcher
                const switcher = this.ui.createElement('switcher', this.node);
                const container = this.ui.createElement('switcher-container', switcher);
                this.ui.createElement('switcher-background', container);
                this.ui.createElement('switcher-button', switcher);
                this.ui.bindClick(switcher, async () => {
                    const val = !this.node.classList.contains('on');
                    if (this.confirm.has(val)) {
                        const [title, content] = this.confirm.get(val);
                        if (!await this.app.confirm(title ?? '确定' + (val ? '开启' : '关闭') + caption + '？', { content })) {
                            return;
                        }
                    }
                    onclick(val);
                });
            }
        }
        // assign value
        assign(value) {
            if (typeof value === 'boolean') {
                // boolean toggle
                this.node.classList[value ? 'add' : 'remove']('on');
            }
            else if (this.text && this.choices) {
                // menu based switcher
                this.text.innerHTML = this.choices.get(value) || '';
            }
        }
    }

    const componentClasses = new Map();
    componentClasses.set('app', App);
    componentClasses.set('collection', Collection);
    componentClasses.set('dialog', Dialog);
    componentClasses.set('lobby', Lobby);
    componentClasses.set('sidebar', Sidebar);
    componentClasses.set('arena', Arena);
    componentClasses.set('player', Player);
    componentClasses.set('button', Button);
    componentClasses.set('gallery', Gallery);
    componentClasses.set('input', Input);
    componentClasses.set('pane', Pane);
    componentClasses.set('popup', Popup);
    componentClasses.set('splash-bar', SplashBar);
    componentClasses.set('splash-gallery', SplashGallery);
    componentClasses.set('splash-hub', SplashHub);
    componentClasses.set('splash-room', SplashRoom);
    componentClasses.set('splash-settings', SplashSettings);
    componentClasses.set('splash', Splash);
    componentClasses.set('toggle', Toggle);

    /** Callback for dom events. */
    class Binding {
        constructor() {
            // current offset
            this.offset = null;
            // maximium offset
            this.movable = null;
            // move callback for pointermove
            this.onmove = null;
            // move callback for pointermove outside the range
            this.onoff = null;
            // move callback for pointerup
            this.onmoveend = null;
            // click callback for pointerup
            this.onclick = null;
            // callback for pointerdown
            this.ondown = null;
        }
    }
    class UI {
        constructor(client) {
            /** Current zoom level. */
            this.zoom = 1;
            // temperoary disable event trigger after pointerup to prevent unintended clicks
            this.dispatched = false;
            /** Bindings for DOM events. */
            this.bindings = new Map();
            // clicking[0]: element that is clicked
            // clicking[1]: location of pointerdown
            // clicking[2]: started by a touch event
            this.clicking = null;
            // moving[0]: element that is moved
            // moving[1]: location of pointerdown
            // moving[2]: initial transform of target element when pointerdown is fired
            // moving[3]: return value of the binding.onmove
            // moving[4]: started by a touch event
            this.moving = null;
            this.client = client;
            // wait for document.body to load
            if (document.readyState === 'loading') {
                this.ready = new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            else {
                this.ready = Promise.resolve();
            }
            this.ready.then(() => {
                document.body.addEventListener('touchmove', e => this.pointerMove(e.touches[0], true), { passive: true });
                document.body.addEventListener('touchend', () => this.pointerEnd(true), { passive: true });
                document.body.addEventListener('touchcancel', () => this.pointerCancel(true), { passive: true });
                if (this.client.platform !== 'Android') {
                    document.body.addEventListener('mousemove', e => this.pointerMove(e, false), { passive: true });
                    document.body.addEventListener('mouseup', () => this.pointerEnd(false), { passive: true });
                    document.body.addEventListener('mouseleave', () => this.pointerCancel(false), { passive: true });
                }
                this.app = this.create('app');
            });
        }
        // get the location of mouse or touch event
        locate(e) {
            return {
                x: Math.round(e.clientX / this.zoom),
                y: Math.round(e.clientY / this.zoom)
            };
        }
        // register pointerdown for click or move
        register(node) {
            // event callback
            const binding = new Binding();
            this.bindings.set(node, binding);
            // register event
            const dispatchDown = (e, touch) => {
                const origin = this.locate(e);
                // initialize click event
                if (binding.onclick && !this.clicking) {
                    node.classList.add('clickdown');
                    this.clicking = [node, origin, touch];
                }
                // initialize move event
                if (binding.movable && !this.moving) {
                    this.moving = [node, origin, binding.offset || { x: 0, y: 0 }, null, touch];
                    // fire ondown event
                    if (binding.ondown) {
                        binding.ondown(origin);
                    }
                }
            };
            node.addEventListener('touchstart', e => dispatchDown(e.touches[0], true), { passive: true });
            if (this.client.platform !== 'Android') {
                node.addEventListener('mousedown', e => dispatchDown(e, false), { passive: true });
            }
            return binding;
        }
        // cancel click callback for current pointerdown
        resetClick(node) {
            if (this.clicking && this.clicking[0] === node) {
                this.clicking = null;
            }
            node.classList.remove('clickdown');
        }
        // cancel move callback for current pointerdown
        resetMove(node) {
            if (this.moving && this.moving[0] === node) {
                this.moving = null;
            }
        }
        // callback for mousemove or touchmove
        pointerMove(e, touch) {
            const { x, y } = this.locate(e);
            // not a click event if move distance > 5px
            if (this.clicking && this.clicking[2] === touch) {
                const [node, origin] = this.clicking;
                const dx = origin.x - x;
                const dz = origin.y - y;
                if (dx * dx + dz * dz > 25) {
                    this.resetClick(node);
                }
            }
            // get offset and trigger move event
            if (this.moving && this.moving[4] === touch) {
                const [node, origin, offset] = this.moving;
                this.dispatchMove(node, {
                    x: x - origin.x + offset.x,
                    y: y - origin.y + offset.y
                });
            }
        }
        // callback for mouseup or touchend
        pointerEnd(touch) {
            if (this.dispatched === false) {
                // dispatch events
                if (this.clicking && this.clicking[2] === touch) {
                    this.dispatched = true;
                    this.dispatchClick(this.clicking[0]);
                }
                if (this.moving && this.moving[4] === touch) {
                    this.dispatched = true;
                    this.dispatchMoveEnd(this.moving[0]);
                }
                // re-enable event trigger after 200ms
                if (this.dispatched) {
                    window.setTimeout(() => this.dispatched = false, 200);
                }
            }
            if (this.clicking && this.clicking[2] === touch) {
                this.clicking = null;
            }
            if (this.moving && this.moving[4] === touch) {
                this.moving = null;
            }
        }
        // callback for mouseleave or touchcancel
        pointerCancel(touch) {
            if (this.clicking && this.clicking[2] === touch) {
                this.clicking[0].classList.remove('clickdown');
            }
            if (this.moving && this.moving[4] === touch) {
                this.dispatchMoveEnd(this.moving[0]);
            }
            this.clicking = null;
            this.moving = null;
        }
        /** Create new component. */
        create(tag, parent = null, id = null) {
            const cls = componentClasses.get(tag);
            const cmp = new cls(this.client, cls.tag || tag, id);
            // add className for a Component subclass with a static tag
            if (cls.tag) {
                cmp.node.classList.add(tag);
            }
            if (parent) {
                parent.appendChild(cmp.node);
            }
            return cmp;
        }
        // create HTMLElement
        createElement(tag, parent = null) {
            const tags = tag.split('.');
            const tagName = 'noname-' + tags[0];
            // define custom element
            if (!customElements.get(tagName)) {
                customElements.define(tagName, class extends HTMLElement {
                });
            }
            // create and append to parent
            const node = document.createElement(tagName);
            for (let i = 1; i < tags.length; i++) {
                node.classList.add(tags[i]);
            }
            if (parent) {
                parent.appendChild(node);
            }
            return node;
        }
        /** Set background image and set background position/size to center/cover. */
        setBackground(node, ...args) {
            if (!args[args.length - 1].includes('.')) {
                args[args.length - 1] += '.webp';
            }
            node.style.background = `url(${args.join('/')}) center/cover`;
        }
        /** Set background image from an extension. */
        setImage(node, url) {
            if (url.includes(':')) {
                const [ext, name] = url.split(':');
                this.setBackground(node, 'extensions', ext, 'images', name);
            }
            else {
                this.setBackground(node, url);
            }
        }
        /** Register component constructor. */
        registerComponent(key, cls) {
            componentClasses.set(key, cls);
        }
        /** Set binding for ClickEvent. */
        bindClick(node, onclick) {
            // get or create registry for node
            const binding = this.bindings.get(node) || this.register(node);
            // bind click event
            binding.onclick = onclick;
        }
        /** Set binding for MoveEvent. */
        bindMove(node, config) {
            // get or create registry for node
            const binding = this.bindings.get(node) || this.register(node);
            // set move area
            binding.movable = config.movable;
            // bind pointerdown event
            binding.ondown = config.ondown || null;
            // bind move event
            binding.onmove = config.onmove || null;
            // bind moveend event
            binding.onmoveend = config.onmoveend || null;
            // bind onoff event
            binding.onoff = config.onoff || null;
            // initial offset
            binding.offset = config.offset || null;
        }
        /** Fire click event. */
        dispatchClick(node) {
            // onclick
            const binding = this.bindings.get(node);
            if (binding && binding.onclick) {
                if (this.clicking && this.clicking[0] === node) {
                    // use the location of this.clicking if applicable
                    binding.onclick.call(node, this.clicking[1]);
                }
                else {
                    // a pseudo click event without location info
                    binding.onclick.call(node, { x: 0, y: 0 });
                }
            }
            // avoid duplicate trigger
            this.resetClick(node);
            this.resetMove(node);
        }
        /** Fire move event. */
        dispatchMove(node, location) {
            const binding = this.bindings.get(node);
            if (binding && binding.movable) {
                // get offset of node
                const movable = binding.movable;
                let x = Math.min(Math.max(location.x, movable.x[0]), movable.x[1]);
                let y = Math.min(Math.max(location.y, movable.y[0]), movable.y[1]);
                // trigger onoff
                if (binding.onoff && (x != location.x || y != location.y)) {
                    const off = binding.onoff({ x, y }, { x: location.x, y: location.y });
                    x = off.x;
                    y = off.y;
                }
                // set and save node offset
                node.style.transform = `translate(${x}px, ${y}px)`;
                binding.offset = { x, y };
                // trigger onmove
                if (binding.onmove) {
                    const state = binding.onmove(binding.offset);
                    // save move state to this.moving if applicable
                    if (this.moving && this.moving[0] === node) {
                        this.moving[3] = state;
                    }
                }
            }
        }
        /** Fire moveend event. */
        dispatchMoveEnd(node) {
            // onmoveend
            const binding = this.bindings.get(node);
            if (binding && binding.onmoveend) {
                if (this.moving && this.moving[0] === node) {
                    // pass the state of this.moving if applicable
                    binding.onmoveend(this.moving[3]);
                }
                else {
                    // a pseudo moveend event without current state
                    binding.onmoveend(null);
                }
            }
            // avoid duplicate trigger
            this.resetClick(node);
            this.resetMove(node);
        }
        /** Wrapper of HTMLElement.animate(). */
        animate(node, animation, config) {
            const keyframes = [];
            let length = 0;
            for (const key in animation) {
                if (key === 'auto' || key === 'forward') {
                    continue;
                }
                length = Math.max(length, animation[key].length);
            }
            for (let i = 0; i < length; i++) {
                const frame = {};
                if ('x' in animation) {
                    frame.transform = `translateX(${animation.x[i]}px)`;
                }
                if ('y' in animation) {
                    frame.transform = (frame.transform || '') + ` translateY(${animation.y[i]}px)`;
                }
                if ('scale' in animation) {
                    frame.transform = (frame.transform || '') + ` scale(${animation.scale[i]})`;
                }
                if ('opacity' in animation) {
                    frame.opacity = animation.opacity[i].toString();
                }
                keyframes.push(frame);
            }
            if (animation.auto) {
                const frame = {};
                for (const key in keyframes[0]) {
                    frame[key] = getComputedStyle(node)[key];
                }
                keyframes.unshift(frame);
            }
            if (!config) {
                config = {};
            }
            else if (typeof config === 'number') {
                config = { duration: config };
            }
            if (!config.easing) {
                config.easing = 'ease';
            }
            if (!config.duration) {
                config.duration = this.app.getTransition();
            }
            if (animation.forward) {
                const frame = keyframes[keyframes.length - 1];
                for (const key in frame) {
                    node.style[key] = frame[key];
                }
            }
            return node.animate(keyframes, config);
        }
    }

    /**
     * Executor of worker commands.
     */
    class Client {
        constructor() {
            /** Client version. */
            this.version = version;
            /** Worker object. */
            this.connection = null;
            /** Service worker. */
            this.registration = null;
            /** ID of current stage. */
            this.sid = 0;
            /** IndexedDB manager. */
            this.db = new Database();
            /** Component manager. */
            this.ui = new UI(this);
            /** Debug mode */
            this.debug = false;
            /** Components synced with the worker. */
            this.components = new Map();
            /** Event listeners. */
            this.listeners = {
                // connection status change
                sync: new Set(),
                // document resize
                resize: new Set(),
                // back button pressed (Android)
                history: new Set(),
                // keyboard event
                key: new Set(),
                // stage change
                stage: new Set()
            };
            /**  UITicks waiting for dispatch. */
            this.ticks = [];
            /** Timestamp of the last full UI load. */
            this.loaded = 0;
            // get user ID
            this.db.ready.then(() => {
                if (!this.db.get('uid')) {
                    // create a new unique client id based on current timestamp
                    const seed = new Date().getTime().toString();
                    // map timestamp to random string
                    this.db.set('uid', seed.split('').map(n => {
                        // [0-9] -> [0-62]
                        const c = Math.floor((parseInt(n) + Math.random()) * 6.2);
                        // [0-62] -> [A-Z] | [a-z] | [0-9]
                        return String.fromCharCode(c < 26 ? c + 65 : (c < 52 ? c + 71 : c - 4));
                    }).join(''));
                }
                this.uid = this.db.get('uid');
            });
            // register service worker for PWA
            navigator.serviceWorker?.register('/service.js').then(reg => {
                this.registration = reg;
            });
        }
        /** Client platform. */
        get platform() {
            if (navigator.platform === 'iPhone' || (navigator.platform === 'MacIntel' && 'ontouchend' in document)) {
                return 'iOS';
            }
            else if (navigator.userAgent.includes('Android')) {
                return 'Android';
            }
            else {
                return 'Desktop';
            }
        }
        /** Initialization message. */
        get info() {
            return [
                this.db.get('nickname') || config.nickname,
                this.db.get('avatar') || config.avatar
            ];
        }
        /** WebSocket address. */
        get url() {
            return this.db.get('ws') || config.ws;
        }
        /** Connected remote clients. */
        get peers() {
            return this.ui.app?.arena?.get('peers') ?? null;
        }
        /** Fetch and parse json file. */
        readJSON(...args) {
            return new Promise(resolve => {
                fetch(args.join('/')).then(response => {
                    response.json().then(resolve);
                });
            });
        }
        /** Connect to web worker. */
        connect(config) {
            this.disconnect();
            if (Array.isArray(config)) {
                const connection = this.connection = new Worker(`dist/worker.js`, { type: 'module' });
                connection.onmessage = ({ data }) => {
                    if (data === 'ready') {
                        connection.onmessage = ({ data }) => this.tick(data);
                        config.push(this.db.get(config[0] + ':disabledHeropacks') || []);
                        config.push(this.db.get(config[0] + ':disabledCardpacks') || []);
                        config.push(this.db.get(config[0] + ':config') || {});
                        config.push(this.info);
                        this.send(0, config, true);
                    }
                };
            }
            else {
                this.connection = new WebSocket(config);
            }
        }
        /** Disconnect from web worker. */
        disconnect() {
            if (this.connection instanceof Worker) {
                this.connection.terminate();
            }
            else if (this.connection instanceof WebSocket) {
                this.connection.close();
            }
            this.connection = null;
            this.clear();
        }
        /** Clear currently connection status without disconnecting. */
        clear(back = true) {
            for (const cmp of this.components.values()) {
                this.removeListeners(cmp);
            }
            this.components.clear();
            this.ui.app.clearPopups();
            this.ui.app.arena?.remove();
            this.ui.app.arena = null;
            if (back) {
                this.ui.app.splash.show();
                this.sid = 0;
            }
        }
        /**
         * Send message to worker.
         * @param {number} id - Message id.
         * @param {boolean} err - Whether an error is encountered.
         * @param {...any[]} args - Message content.
         */
        send(id, result, done) {
            const msg = [this.uid, this.sid, id, result, done];
            if (this.connection instanceof Worker) {
                this.connection.postMessage(msg);
            }
            else if (this.connection instanceof WebSocket) {
                this.connection.send('resp:' + JSON.stringify(msg));
            }
        }
        /**
         * Call or check the existence of a plugin method.
         * @param {number} id - ID of the method call.
         * @param {string} name - Plugin name .
         * @param {string} method - Method to be called or checked.
         * @param {any[]} [args] - If args is array, call method with args as arguments,
         * if args is undefined, check the existence of the method instead.
         */
        async dispatch() {
            try {
                const [sid, tags, props, calls] = this.ticks[0];
                // check if tick is a full UI reload
                for (const key in tags) {
                    if (tags[key] === 'arena') {
                        this.clear(false);
                        this.loaded = Date.now();
                        break;
                    }
                }
                if (!this.loaded) {
                    throw ('UI not loaded');
                }
                // clear unfinished function calls (e.g. selectCard / selectTarget)
                if (sid !== this.sid) {
                    this.triggerListeners('stage');
                    this.listeners.stage.clear();
                    this.sid = sid;
                }
                // create new components
                const newComponents = [];
                for (const key in tags) {
                    const id = parseInt(key);
                    const tag = tags[key];
                    if (typeof tag === 'string') {
                        this.components.get(id)?.remove();
                        const cmp = this.ui.create(tag, null, id);
                        this.components.set(id, cmp);
                        newComponents.push(cmp.ready);
                    }
                }
                await Promise.all(newComponents);
                // update component properties
                let hooks = [];
                for (const key in props) {
                    hooks = hooks.concat(this.components.get(parseInt(key)).update(props[key], false));
                }
                for (const [hook, cmp, newVal, oldVal] of hooks) {
                    hook.apply(cmp, [newVal, oldVal]);
                }
                // call component methods
                for (const key in calls) {
                    const id = parseInt(key);
                    for (const [method, arg] of calls[key]) {
                        this.components.get(id)[method](arg);
                    }
                }
                // delete components
                for (const key in tags) {
                    const id = parseInt(key);
                    if (tags[key] === null) {
                        const cmp = this.components.get(id);
                        if (cmp) {
                            this.removeListeners(cmp);
                            this.components.delete(id);
                        }
                    }
                }
            }
            catch (e) {
                console.log(e);
                if (Date.now() - this.loaded < 500) {
                    // prompt reload if error occus within 0.5s after reload
                    this.loaded = 0;
                    this.ui.app.confirm('游戏错误', { content: '点击“确定”重新载入游戏，点击“取消”尝试继续。' }).then(reload => {
                        if (reload === true) {
                            window.location.reload();
                        }
                        else if (reload === false) {
                            this.send(-1, null, false);
                        }
                    });
                }
                else if (this.loaded) {
                    // tell worker to reload UI
                    this.loaded = 0;
                    this.send(-1, null, false);
                }
            }
            this.ticks.shift();
            if (this.ticks.length) {
                this.dispatch();
            }
        }
        /** Add a UITick to dispatch. */
        tick(data) {
            this.ticks.push(data);
            if (this.ticks.length === 1) {
                this.dispatch();
            }
        }
        /** Trigger a listener. */
        triggerListeners(event, arg) {
            for (const cmp of this.listeners[event]) {
                cmp[event](arg);
            }
        }
        /** Remove all listeners. */
        removeListeners(cmp) {
            for (const key in this.listeners) {
                this.listeners[key].delete(cmp);
            }
        }
    }

    const client = new Client();
    client.debug = true;
    globalThis.client = client;

}());
