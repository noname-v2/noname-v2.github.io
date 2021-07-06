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
        constructor(client, tag) {
            /** Properties synced with worker. */
            this.props = new Map();
            /** Component ID (for worker-managed components). */
            this.id = null;
            /** Monitor ID. */
            this.monitor = null;
            this.client = client;
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
        /** Update properties. Special key:
         * #tag: tag name (no operation).
         * owner: uid of client that controlls the component
        */
        update(items) {
            const hooks = [];
            for (const key in items) {
                const oldVal = this.get(key);
                const newVal = items[key] ?? null;
                newVal === null ? this.props.delete(key) : this.props.set(key, newVal);
                const hook = this['$' + key];
                if (typeof hook === 'function') {
                    hooks.push([hook, newVal, oldVal]);
                }
            }
            for (const [hook, newVal, oldVal] of hooks) {
                hook.apply(this, [newVal, oldVal]);
            }
        }
        /** Send result to worker (component must be monitored). */
        yield(result, done = true) {
            if (this.id === null) {
                throw ('element is has no ID');
            }
            this.client.send(this.id, result, done);
            if (!done) {
                return new Promise(resolve => {
                    this.client.yielding.set(this.id, resolve);
                });
            }
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
        }
        init() {
            document.head.appendChild(this.themeNode);
            // setup triggers
            this.resize();
            window.addEventListener('resize', this.resize.bind(this));
            this.node.addEventListener('wheel', e => e.preventDefault(), { passive: false }); // prevent two finger swipe gesture in safari
            document.oncontextmenu = () => false;
            document.body.appendChild(this.node);
            // wait for indexedDB
            this.db.ready.then(() => {
                this.loadBackground();
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
                // index and load assets
                this.splash = this.ui.create('splash');
                this.loadTheme().then(() => {
                    this.splash.show();
                    this.loadAssets().then(() => {
                        this.splash.node.classList.add('font-loaded');
                        this.splash.hub.create(this.splash);
                        this.splash.settings.create(this.splash);
                    });
                });
            });
        }
        /** Index assets and load fonts. */
        async loadAssets() {
            this.assets = await this.client.readJSON('assets/index.json');
            // add fonts
            const fonts = document.fonts;
            for (const font in this.assets['font']) {
                const fontPath = 'assets/font/' + font + '.woff2';
                const fontFace = new window.FontFace(font, `url(${fontPath})`);
                fonts.add(fontFace);
            }
            await document.fonts.ready;
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
            // reduce the number of digits of floating point number
            const scale = (z) => `scale(${Math.ceil(z * 500) / 500})`;
            // ideal window size
            let [ax, ay] = [960, 540];
            // determine ideal size based on player number
            if (this.arena) {
                [ax, ay] = this.arena.resize(ax, ay, width, height);
            }
            // zoom to fit ideal size
            const zx = width / ax, zy = height / ay;
            if (zx < zy) {
                this.node.style.width = ax + 'px';
                this.node.style.height = ax / width * height + 'px';
                this.node.style.transform = scale(zx);
                this.ui.zoom = zx;
            }
            else {
                this.node.style.width = ay / height * width + 'px';
                this.node.style.height = ay + 'px';
                this.node.style.transform = scale(zy);
                this.ui.zoom = zy;
            }
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
    }

    class Lobby extends Component {
        constructor() {
            super(...arguments);
            this.sidebar = this.ui.create('sidebar', this.node);
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
        }
        init() {
            this.app.arena.node.appendChild(this.node);
            this.sidebar.ready.then(() => {
                this.sidebar.setHeader('返回', () => {
                    this.client.disconnect();
                    this.ui.animate(this.sidebar.node, { x: [0, -220] }, { fill: 'forwards' });
                });
                this.sidebar.setFooter('开始游戏', () => {
                    this.yield(null);
                });
            });
            this.sidebar.pane.node.classList.add('fixed');
            this.ui.animate(this.sidebar.node, { x: [-220, 0] });
        }
        $pane(configs) {
            this.sidebar.pane.addSection('选项');
            for (const name in configs.configs) {
                const config = configs.configs[name];
                const toggle = this.sidebar.pane.addToggle(config.name, result => {
                    this.freeze();
                    if (name === 'online' && result) {
                        this.connecting = true;
                        this.yield(['config', name, [this.client.info, this.client.url]], false);
                    }
                    else {
                        this.yield(['config', name, result], false);
                    }
                }, config.options);
                toggle.confirm = config.confirm;
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
                this.db.set(this.get('mode') + ':config', config);
            }
        }
        $disabledHeropacks(packs) {
            for (const [name, toggle] of this.heroToggles.entries()) {
                toggle.assign(!packs.includes(name));
            }
            if (this.owner === this.client.uid) {
                this.db.set(this.get('mode') + ':disabledHeropacks', packs.length > 0 ? packs : null);
            }
        }
        $disabledCardpacks(packs) {
            for (const [name, toggle] of this.cardToggles.entries()) {
                toggle.assign(!packs.includes(name));
            }
            if (this.owner === this.client.uid) {
                this.db.set(this.get('mode') + ':disabledCardpacks', packs.length > 0 ? packs : null);
            }
        }
        $connected(val) {
            this.unfreeze();
            this.configToggles.get('online')?.assign(val);
            if (!val && this.connecting) {
                alert('连接失败');
            }
            this.connecting = false;
        }
        freeze() {
            this.sidebar.pane.node.classList.add('pending');
        }
        unfreeze() {
            this.sidebar.pane.node.classList.remove('pending');
        }
    }

    class PackGallery extends Component {
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
            this.pane.enableScroll();
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
            // layout mode
            this.layout = 0;
            // player that is under control
            this.viewport = 0;
            // card container
            this.cards = this.ui.createElement('cards');
            // player container
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
                this.node.remove();
            };
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
            /** Whether other pages are visible. */
            this.overflow = false;
            /** Rendered pages. */
            this.rendered = new Set();
            /** Gallery items. */
            this.items = [];
            /** Index of current page. */
            this.currentPage = 0;
            /** Currently being blocked. */
            this.moving = false;
            /** Block accelerated scrolling with mac trackpad. */
            this.acceleration = [];
            this.accelerationTimeout = 0;
            this.scrollTimeout = 0;
        }
        /** Current number of pages. */
        get pageCount() {
            return this.pages.childNodes.length;
        }
        /** Create page when needed. */
        renderPage(i) {
            const page = this.pages.childNodes[i];
            if (!page || this.rendered.has(i)) {
                return;
            }
            this.rendered.add(i);
            const start = this.nrows * this.ncols * i;
            const containers = document.createDocumentFragment();
            for (let i = 0; i < this.nrows * this.ncols; i++) {
                let item = this.items[start + i];
                if (typeof item === 'function') {
                    item = this.items[start + i] = item();
                }
                let container = page.firstChild.childNodes[i];
                if (!container) {
                    container = this.ui.createElement('item');
                    containers.appendChild(container);
                }
                if (item && !container.contains(item)) {
                    container.appendChild(item);
                }
            }
            if (containers.childNodes.length) {
                page.firstChild.appendChild(containers);
            }
        }
        /** Turn page with mousewheel (with support for mac trackpad). */
        wheel(e) {
            if (this.moving) {
                return;
            }
            // save acceleration history
            const direction = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (Math.abs(direction) > 5) {
                Gallery.smoothScroll = true;
            }
            else if (Gallery.smoothScroll) {
                return;
            }
            // mark wheel event as finished after 80ms without update
            clearTimeout(this.accelerationTimeout);
            this.accelerationTimeout = window.setTimeout(() => {
                this.acceleration.length = 0;
                this.accelerationTimeout = 0;
                clearTimeout(this.scrollTimeout);
                this.scrollTimeout = 0;
            }, 80);
            // detect continous scroll
            const idx = this.acceleration.indexOf(null);
            if (idx !== -1) {
                if (direction * this.acceleration[0] < 0) {
                    const a1 = this.acceleration[this.acceleration.length - 1];
                    const a2 = this.acceleration[this.acceleration.length - 2];
                    if (direction * a1 > 0 && direction * a2 > 0) {
                        this.acceleration.length = 0;
                    }
                }
                else {
                    const acceleration = this.acceleration.slice(idx + 1);
                    acceleration.push(direction);
                    let decreased = 0;
                    let increased = 0;
                    for (let i = acceleration.length - 1; i >= 1; i--) {
                        const a1 = Math.abs(acceleration[i]);
                        const a2 = Math.abs(acceleration[i - 1]);
                        if (a1 > a2) {
                            if (!increased) {
                                decreased++;
                            }
                            else {
                                break;
                            }
                        }
                        else if (a1 < a2) {
                            if (decreased < 2) {
                                break;
                            }
                            else {
                                increased += 1;
                                if (increased >= 2) {
                                    this.acceleration.length = 0;
                                    break;
                                }
                            }
                        }
                    }
                    if (acceleration.length >= 3) {
                        let same = true;
                        for (let i = 0; i < acceleration.length; i++) {
                            if (acceleration[i] !== direction) {
                                same = false;
                                break;
                            }
                        }
                        if (same) {
                            this.acceleration.length = 0;
                        }
                    }
                }
            }
            this.acceleration.push(direction);
            if (this.acceleration.length === 1) {
                if (direction > 0) {
                    this.turnPage(this.currentPage + 1);
                }
                else if (direction < 0) {
                    this.turnPage(this.currentPage - 1);
                }
                clearTimeout(this.scrollTimeout);
                const timeout = this.scrollTimeout = window.setTimeout(() => {
                    if (timeout === this.scrollTimeout) {
                        this.acceleration.push(null);
                    }
                }, 100);
            }
        }
        init() {
            this.node.addEventListener('wheel', e => this.wheel(e), { passive: true });
            if (this.overflow) {
                this.node.classList.add('overflow');
            }
        }
        add(item) {
            // page index
            const idx = Math.floor(this.items.length / (this.nrows * this.ncols));
            this.items.push(item);
            if (idx >= this.pageCount) {
                const page = this.ui.createElement('page');
                page.style.width = this.width + 'px';
                this.ui.createElement('layer', page);
                this.pages.appendChild(page);
                const dot = this.ui.createElement('dot', this.indicator);
                this.ui.createElement('layer', dot);
                this.ui.createElement('layer', dot);
                if (this.pageCount > 1) {
                    this.node.classList.add('with-indicator');
                }
                this.turnPage(0, false);
            }
            else {
                this.rendered.delete(idx);
            }
            if (idx < 2) {
                this.renderPage(idx);
            }
        }
        turnPage(page, animate = true) {
            if (page >= this.pageCount || page < 0) {
                return;
            }
            if (animate) {
                this.ui.animate(this.pages, {
                    x: [-page * this.width], auto: true, forward: true
                });
            }
            this.currentPage = page;
            // update the move range of page container
            const offset = -this.currentPage * this.width;
            this.ui.bindMove(this.pages, {
                movable: { x: [-this.width * (this.pageCount - 1), 0], y: [0, 0] },
                offset: { x: offset, y: 0 },
                onoff: (e1, e2) => {
                    if (this.pageCount > 1) {
                        const dx = e2.x - e1.x;
                        const ref = this.width / 10 * (dx > 0 ? 1 : -1);
                        return { x: e1.x + ref * (1 - 1 / Math.exp(dx / ref / 2)), y: e1.y };
                    }
                    else {
                        return e1;
                    }
                },
                onmove: ({ x }) => {
                    if (x < offset - this.width) {
                        const n = Math.ceil((offset - this.width - x) / this.width);
                        for (let i = 0; i < n; i++) {
                            this.renderPage(this.currentPage + 2 + i);
                        }
                    }
                    if (this.overflow) {
                        const dx = x + this.currentPage * this.width;
                        const current = this.pages.querySelector('.current');
                        this.pages.classList.add('moving');
                        if (current && dx) {
                            const n = Math.abs(dx / this.width);
                            const nodes = [current];
                            const p = n - Math.floor(n);
                            let node = current;
                            for (let i = 0; i < n; i++) {
                                if (dx < 0) {
                                    node = node?.nextSibling;
                                }
                                else {
                                    node = node?.previousSibling;
                                }
                                nodes.push(node);
                            }
                            for (let i = 0; i < nodes.length; i++) {
                                node = nodes[i];
                                if (!node) {
                                    continue;
                                }
                                if (i === nodes.length - 1) {
                                    node.style.opacity = Math.min(1, 1 - Math.cos(p * Math.PI));
                                }
                                else if (i === nodes.length - 2) {
                                    node.style.opacity = 1 + Math.cos((p + 1) * Math.PI / 2);
                                }
                                else {
                                    node.style.opacity = 0;
                                }
                            }
                        }
                    }
                    return x;
                },
                onmoveend: x => {
                    if (typeof x === 'number') {
                        if (x > offset + 5) {
                            this.turnPage(Math.max(0, this.currentPage - Math.ceil((x - offset - 5) / this.width)));
                        }
                        else if (x < offset - 5) {
                            this.turnPage(Math.min(this.pageCount - 1, this.currentPage + Math.ceil((offset - 5 - x) / this.width)));
                        }
                        else if (x !== offset) {
                            this.turnPage(this.currentPage);
                        }
                    }
                    this.moving = false;
                },
                ondown: () => this.moving = true
            });
            // create current and next page
            this.renderPage(page);
            this.renderPage(page + 1);
            this.renderPage(page - 1);
            // highlight current page
            if (this.overflow) {
                this.pages.classList.remove('moving');
                for (const node of this.pages.childNodes) {
                    node.style.opacity = '';
                }
                this.pages.querySelector('noname-page.current')?.classList.remove('current');
                this.pages.childNodes[page].classList.add('current');
            }
            // show indicator
            this.indicator.querySelector('.current')?.classList.remove('current');
            this.indicator.childNodes[page].classList.add('current');
        }
    }
    Gallery.smoothScroll = false;

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
            this.center = true;
            /** Built-in sizes. */
            this.size = null;
            /** Animation speed of open and close. */
            this.transition = null;
        }
        init() {
            this.node.classList.add('noname-popup');
            if (this.center) {
                this.node.classList.add('center');
            }
            if (typeof this.size === 'string') {
                this.node.classList.add(this.size);
            }
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
            if (this.onopen) {
                this.onopen();
            }
            if (this.node.parentNode !== this.app.node) {
                this.app.node.appendChild(this.node);
            }
            this.ui.animate(this.pane.node, {
                opacity: [0, 1], scale: ['var(--popup-transform)', 1]
            }, this.app.getTransition(this.transition));
        }
    }

    class Menu extends Popup {
        constructor() {
            super(...arguments);
            /** Use mouse click location. */
            this.center = false;
            /** Use faster transition for context menu. */
            this.transition = 'fast';
        }
        open() {
            this.node.classList.add('hidden');
            this.app.node.appendChild(this.node);
            requestAnimationFrame(() => {
                // determine location of the menu
                let { x, y } = this.position;
                const rect1 = this.pane.node.getBoundingClientRect();
                const rect2 = this.app.node.getBoundingClientRect();
                const zoom = this.ui.zoom;
                this.node.classList.remove('hidden');
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
                super.open();
            });
        }
    }
    /** Use <noname-popup> as tag. */
    Menu.tag = 'popup';

    class Pane extends Component {
        /** Section title. */
        addSection(caption) {
            const section = this.ui.createElement('section', this.node);
            this.ui.createElement('span', section).innerHTML = caption;
            return section;
        }
        /** Gallery of selectable items. */
        addGallery(nrows, ncols, width) {
            const gallery = this.ui.create('gallery');
            gallery.nrows = nrows;
            gallery.ncols = ncols;
            gallery.width = width;
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
        /** Enable vertical scrolling. */
        enableScroll() {
            this.ui.enableScroll(this.node);
        }
    }

    class SplashBar extends Component {
        constructor() {
            super(...arguments);
            this.buttons = {
                /** Clear cached files and reload. */
                reset: this.ui.create('button'),
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
            }
            else {
                this.buttons.reset.node.classList.remove('disabled');
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
            /** 5 Columns in a page. */
            this.ncols = 5;
            /** Default window width. */
            this.width = 900;
            /** Extension index. */
            this.index = {};
        }
        async init() {
            super.init();
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
                    this.index[name] = idx;
                }
                catch {
                    console.log(name);
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
        }
        create(splash) {
            // nickname, avatar and this address
            this.addInfo();
            // room list in this menu
            this.numSection = this.pane.addSection('');
            this.numSection.classList.add('hidden');
            this.pane.node.appendChild(this.roomGroup);
            this.ui.enableScroll(this.roomGroup);
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
        }
        clearRooms() {
            for (const room of this.rooms.values()) {
            }
        }
        updateRooms() {
            if (this.rooms.size) {
                this.roomGroup.classList.remove('hidden');
                this.caption.classList.add('hidden');
            }
            else {
                this.setCaption('暂无房间');
            }
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
                        ws.send('init:' + JSON.stringify(this.client.info));
                    };
                    ws.onmessage = ({ data }) => {
                        try {
                            const idx = data.indexOf(':');
                            const method = data.slice(0, idx);
                            const arg = data.slice(idx + 1);
                            if (['reload', 'num', 'edit', 'msg', 'down'].includes(method)) {
                                this[method](arg);
                            }
                        }
                        catch {
                            ws.close();
                        }
                    };
                });
            }
            catch {
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
            const group = this.ui.createElement('group');
            this.pane.node.appendChild(group);
            // avatar
            const avatarNode = this.ui.createElement('widget', group);
            const img = this.ui.createElement('image', avatarNode);
            const url = this.db.get('avatar') ?? config.avatar;
            if (url.includes(':')) {
                const [ext, name] = url.split(':');
                this.ui.setBackground(img, 'extensions', ext, 'images', name);
            }
            else {
                this.ui.setBackground(img, url);
            }
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
        reload(msg) {
            const idx = msg.indexOf(':');
            msg.slice(0, idx);
            JSON.parse(msg.slice(idx + 1));
        }
        edit(msg) {
        }
        num(msg) {
            this.numSection.classList.remove('hidden');
            this.numSection.firstChild.innerHTML = '在线：' + msg;
        }
    }
    /** Use tag <noname-popup>. */
    SplashHub.tag = 'popup';

    class SplashRoom extends Component {
    }

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
        }
        get width() {
            return parseInt(this.app.css.popup['portrait-width']);
        }
        create(splash) {
            this.onopen = () => {
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
            const themeGallery = this.pane.addGallery(1, this.ncols, this.width);
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
            const bgGallery = this.pane.addGallery(1, this.ncols, this.width);
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
            const volGallery = this.pane.addGallery(1, 2, this.width);
            volGallery.node.classList.add('volume');
            volGallery.add(this.createSlider('音乐音量：', 'music-volume'));
            volGallery.add(this.createSlider('音效音量：', 'audio-volume'));
            const bgms = Array.from(Object.keys(this.app.assets.bgm));
            const bgmGallery = this.pane.addGallery(1, this.ncols * 2, this.width);
            bgmGallery.node.classList.add('music');
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
            const menu = this.ui.create('menu');
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
            menu.position = e;
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
            this.ui.animate(this.node, {
                scale: [1, 'var(--app-splash-transform)'], opacity: [1, 0]
            }).onfinish = () => {
                this.node.remove();
            };
        }
        show() {
            this.app.node.appendChild(this.node);
            this.ui.animate(this.node, {
                scale: ['var(--app-splash-transform)', 1], opacity: [0, 1]
            });
        }
    }

    class Toggle extends Component {
        constructor() {
            super(...arguments);
            // caption text
            this.span = this.ui.createElement('span', this.node);
            // disabled choices
            this.disabledChoices = new Set();
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
                    const menu = this.ui.create('menu');
                    for (const [id, name] of choices) {
                        menu.pane.addOption(name, () => {
                            if (this.confirm?.includes(id)) {
                                if (!confirm('确定将' + caption + '设为' + name + '？')) {
                                    return;
                                }
                            }
                            onclick(id);
                            menu.close();
                        });
                    }
                    menu.position = { x: (rect.left + rect.width) / this.ui.zoom + 3, y: rect.top / this.ui.zoom - 3 };
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
                this.ui.bindClick(switcher, () => {
                    const val = !this.node.classList.contains('on');
                    if (this.confirm?.includes(val)) {
                        if (!confirm('确定' + (val ? '开启' : '关闭') + caption + '？')) {
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
    componentClasses.set('lobby', Lobby);
    componentClasses.set('pack-gallery', PackGallery);
    componentClasses.set('sidebar', Sidebar);
    componentClasses.set('arena', Arena);
    componentClasses.set('button', Button);
    componentClasses.set('gallery', Gallery);
    componentClasses.set('input', Input);
    componentClasses.set('menu', Menu);
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
        create(tag, parent = null) {
            const cls = componentClasses.get(tag);
            const component = new cls(this.client, cls.tag || tag);
            if (cls.tag) {
                component.node.classList.add(tag);
            }
            if (parent) {
                parent.appendChild(component.node);
            }
            return component;
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
        // set background image and set background position/size to center/cover
        setBackground(node, ...args) {
            if (!args[args.length - 1].includes('.')) {
                args[args.length - 1] += '.webp';
            }
            node.style.background = `url(${args.join('/')}) center/cover`;
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
        /** Enable vertical scrolling. */
        enableScroll(node) {
            node.classList.add('scroll');
            node.addEventListener('wheel', e => {
                if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
                    e.stopPropagation();
                }
            }, { passive: false });
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
            /** Components awaiting response from worker. */
            this.yielding = new Map();
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
            return [this.uid, [
                    this.db.get('nickname') || config.nickname,
                    this.db.get('avatar') || config.avatar
                ]];
        }
        /** WebSocket address. */
        get url() {
            return this.db.get('ws') || config.ws;
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
                        connection.onmessage = ({ data }) => this.dispatch(data);
                        config.push(this.db.get(config[0] + ':disabledHeropacks') || []);
                        config.push(this.db.get(config[0] + ':disabledCardpacks') || []);
                        config.push(this.db.get(config[0] + ':config') || {});
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
        clear() {
            this.components.clear();
            this.yielding.clear();
            this.ui.app.arena?.remove();
            this.ui.app.arena = null;
            if (!this.ui.app.splash.node.parentNode) {
                this.ui.app.splash.show();
            }
            this.sid = 0;
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
        async dispatch(data) {
            try {
                const [sid, updates, calls] = data;
                // progress to a new stage
                if (sid !== this.sid) {
                    this.yielding.clear();
                    this.sid = sid;
                }
                // update component properties
                for (const key in updates) {
                    const items = updates[key];
                    const id = parseInt(key);
                    // create new component
                    if (typeof items['#tag'] === 'string') {
                        this.components.get(id)?.node.remove();
                        const component = this.ui.create(items['#tag']);
                        component.id = id;
                        this.components.set(id, component);
                        await component.ready;
                    }
                    // update properties
                    this.components.get(id).update(items);
                }
                // call component methods
                for (const key in calls) {
                    const id = parseInt(key);
                    for (const [method, arg] of calls[key]) {
                        if (method === '#unlink') {
                            this.components.delete(id);
                        }
                        else if (method === '#yield') {
                            this.yielding.get(id)(arg);
                        }
                        else {
                            const component = this.components.get(id);
                            await component.ready;
                            component[method](arg);
                        }
                    }
                }
            }
            catch {
                this.send(-1, null, false);
            }
        }
    }

    const client = new Client();
    client.debug = true;
    globalThis.client = client;

}());
