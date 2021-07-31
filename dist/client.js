(function () {
    'use strict';

    class Database {
        /** indexedDB object. */
        #db;
        /** Get, set or delete database entry. */
        #transact(name, cmd, key, value) {
            return new Promise(resolve => {
                const mode = cmd === 'get' ? 'readonly' : 'readwrite';
                const store = this.#db.transaction(name, mode).objectStore(name);
                const request = cmd === 'put' ? store[cmd](value, key) : store[cmd](key);
                request.onsuccess = () => resolve(request.result ?? null);
            });
        }
        /** Cache for synthronous database. */
        #cache = new Map();
        /** Resolved when ready. */
        ready;
        constructor() {
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
                    this.#db = request.result;
                    // cache synchronous database
                    const store = this.#db.transaction('settings', 'readonly').objectStore('settings');
                    const iterator = store.openCursor();
                    // iterate through database and save to this.cache
                    iterator.onsuccess = () => {
                        const cursor = iterator.result;
                        if (cursor) {
                            // set cache value and go to next entry
                            this.#cache.set(cursor.key, cursor.value);
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
        /** Get value of synchronous database entry. */
        get(key) {
            return this.#cache.get(key) ?? null;
        }
        /** Set value of synchronous database entry. */
        set(key, value) {
            if (value === null || value === undefined) {
                // delete entry
                this.#cache.delete(key);
                this.#transact('settings', 'delete', key);
            }
            else {
                // modify entry
                this.#cache.set(key, value);
                this.#transact('settings', 'put', key, value);
            }
        }
        /** Get value from asynchronous database. */
        readFile(key) {
            return this.#transact('files', 'get', key);
        }
        /** Set value to asynchronous database. */
        writeFile(key, value) {
            if (value === null || value === undefined) {
                // delete entry
                return this.#transact('files', 'delete', key);
            }
            else {
                // modify entry
                return this.#transact('files', 'put', key, value);
            }
        }
        /** List all files. */
        readdir() {
            const store = this.#db.transaction('files', 'readonly').objectStore('files');
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
        /** HTMLElement tag  name */
        static tag = null;
        /** Root element. */
        node;
        /** Resolved */
        ready;
        /** This.remove() is being executed. */
        #removing = false;
        /** Properties synced with worker. */
        #props = new Map();
        /** Component ID (for worker-managed components). */
        #id;
        /** Client object. */
        #client;
        /** Database object. */
        #db;
        /** UI object. */
        #ui;
        get client() {
            return this.#client;
        }
        get db() {
            return this.#db;
        }
        get ui() {
            return this.#ui;
        }
        get app() {
            return this.ui.app;
        }
        get owner() {
            return this.get('owner');
        }
        /** Create node. */
        constructor(client, db, ui, tag, id) {
            this.#id = id;
            this.#client = client;
            this.#db = db;
            this.#ui = ui;
            this.node = ui.createElement(tag);
            this.ready = Promise.resolve().then(() => this.init());
        }
        /** Make init() optional for subclasses. */
        init() { }
        ;
        /** Property getter. */
        get(key) {
            return this.#props.get(key) ?? null;
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
                newVal === null ? this.#props.delete(key) : this.#props.set(key, newVal);
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
        /** Send update to worker (component must be monitored). */
        yield(result) {
            if (this.#id === null) {
                throw ('element is has no ID');
            }
            this.client.send(this.#id, result, false);
        }
        /** Send return value to worker (component must be monitored). */
        respond(result) {
            if (this.#id === null) {
                throw ('element is has no ID');
            }
            this.client.send(this.#id, result, true);
        }
        /** Delay for a time period. */
        sleep(dur) {
            return this.client.utils.sleep(this.app.getTransition(dur) / 1000);
        }
        /** Remove element. */
        remove(promise) {
            if (this.#removing) {
                return;
            }
            if (promise) {
                this.#removing = true;
                promise.then(() => {
                    this.node.remove();
                    this.#removing = false;
                });
            }
            else {
                this.node.remove();
            }
        }
    }

    class App extends Component {
        /** Arena component. */
        arena = null;
        /** Splash component. */
        splash;
        /** Transition durations. */
        css = {};
        /** Index of assets. */
        assets;
        /** Popup components cleared when arena close. */
        popups = new Map();
        /** Stylesheet for theme. */
        #themeNode = document.createElement('style');
        /** Node for displaying background. */
        #bgNode = this.ui.createElement('background', this.node);
        /** Node for playing background music. */
        #bgmNode = document.createElement('audio');
        /** Background music volume control. */
        #bgmGain;
        /** Audio context. */
        #audio = new (window.AudioContext || window.webkitAudioContext)();
        /** Count dialog for dialog ID */
        #dialogCount = 0;
        async init() {
            document.head.appendChild(this.#themeNode);
            // setup triggers
            this.resize();
            window.addEventListener('resize', this.resize.bind(this));
            // this.node.addEventListener('wheel', e => e.preventDefault(), {passive: false}); // prevent two finger swipe gesture in safari
            document.oncontextmenu = () => false;
            document.body.appendChild(this.node);
            // wait for indexedDB
            await this.db.ready;
            this.loadBackground();
            this.#initAudio();
            // load styles and fonts
            await this.loadTheme();
            this.splash = this.ui.create('splash');
            await this.splash.gallery.ready;
            const initAssets = this.#initAssets();
            // load splash menus
            Promise.all([initAssets, this.splash.show(), document.fonts.ready]).then(() => {
                this.splash.hub.create(this.splash);
                this.splash.settings.create(this.splash);
            });
            // add handler for android back button
            if (this.client.platform === 'Android') {
                window.addEventListener('popstate', e => {
                    const arena = this.app.arena;
                    if (arena && !arena.exiting) {
                        if (e.state === null) {
                            history.pushState('arena', '');
                        }
                        arena.back();
                    }
                });
            }
        }
        /** Add styles for theme. */
        async loadTheme() {
            // name of current theme (or use default value from defaluts.json)
            const name = this.db.get('theme');
            // fetch current and default theme defination
            const currentTheme = await this.client.utils.readJSON('assets/theme', name, 'theme.json');
            const defaultTheme = await this.client.utils.readJSON('assets/theme', 'default', 'theme.json');
            // theme stylesheet
            const sheet = this.#themeNode.sheet;
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
            // add rules for dataset
            const dataset = {
                buttonicon: 'background-image',
                fill: 'background',
                text: 'text-color',
                shadow: 'text-shadow',
                glow: 'text-shadow'
            };
            for (const section in dataset) {
                for (const name in this.css[section]) {
                    const propName = dataset[section];
                    const propValue = this.css[section][name];
                    sheet.insertRule(`[data-${section}="${name}"] {${propName}: ${propValue}}`, sheet.rules.length);
                }
            }
        }
        /** Add styles for background and font. */
        async loadBackground() {
            const bg = this.db.get('bg');
            if (bg) {
                // use custom background
                this.ui.setBackground(this.#bgNode, 'assets/bg', bg);
            }
            else {
                // use default background
                this.#bgNode.style.background = '';
            }
        }
        /** Play background music. */
        playMusic() {
            const bgm = this.db.get(this.arena ? 'bgm' : 'bgm-splash');
            if (bgm && bgm !== 'none' && this.db.get('music-volume') > 0) {
                this.#bgmNode.src = `assets/bgm/${bgm}.mp3`;
                if (this.#audio.state === 'suspended') {
                    const interact = () => {
                        this.#audio.resume();
                        if (this.#bgmNode.paused && this.db.get('music-volume') > 0) {
                            this.#bgmNode.play();
                        }
                        this.node.removeEventListener('pointerup', interact);
                    };
                    this.node.addEventListener('pointerup', interact);
                }
                else {
                    this.#bgmNode.play();
                }
            }
            else {
                this.#bgmNode.src = '';
            }
        }
        /** Swith background music. */
        switchMusic(bgm) {
            this.#bgmNode.src = `assets/bgm/${bgm}.mp3`;
            this.#bgmNode.play();
        }
        /** Change background music volume. */
        changeVolume(vol) {
            this.#bgmGain.value = vol / 100;
            if (vol && this.#bgmNode.paused) {
                setTimeout(() => this.app.playMusic());
            }
            else if (vol == 0) {
                this.#bgmNode.pause();
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
            this.client.trigger('resize');
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
            const dialogID = id ?? ++this.#dialogCount;
            this.popups.get(dialogID)?.close();
            const onopen = dialog.onopen;
            const onclose = dialog.onclose;
            // other popups that are blurred by dialog.open()
            const blurred = [];
            dialog.onopen = () => {
                // blur arena, splash and other popups
                this.node.classList.add('popped');
                for (const [id, popup] of this.popups.entries()) {
                    if (popup !== dialog && !popup.node.classList.contains('blurred')) {
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
        /** Initialize volume settings. */
        #initAudio() {
            // add default settings
            if (this.db.get('bgm') === null) {
                this.db.set('bgm', 'default-game');
            }
            if (this.db.get('bgm-splash') === null) {
                this.db.set('bgm-splash', 'default-splash');
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
            this.#bgmNode.loop = true;
            this.node.appendChild(this.#bgmNode);
            const track = this.#audio.createMediaElementSource(this.#bgmNode);
            const gainNode = this.#audio.createGain();
            track.connect(gainNode).connect(this.#audio.destination);
            gainNode.gain.value = (vol >= 0 && vol <= 100) ? vol / 100 : 0;
            this.#bgmGain = gainNode.gain;
            this.playMusic();
        }
        /** Index assets and load fonts. */
        async #initAssets() {
            this.assets = await this.client.utils.readJSON('assets/index.json');
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
    }

    class Collection extends Component {
    }

    class Popup extends Component {
        /** Child classes use tag <noname-popup> by default. */
        static tag = 'popup';
        /** Main content. */
        pane = this.ui.create('pane', this.node);
        /** Trigger when dialog is opened. */
        onopen = null;
        /** Trigger when dialog is closed. */
        onclose = null;
        /** Whether popup is closed when clicking on background layer. */
        temp = true;
        /** Whether popup appears at the center. */
        position = null;
        /** Built-in sizes. */
        size = null;
        /** Animation speed of open and close. */
        transition = null;
        /** Currently hidden. */
        hidden = true;
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
            if (this.position === null) {
                this.node.classList.add('center');
            }
            if (typeof this.size === 'string') {
                this.node.classList.add(this.size);
            }
            this.node.classList.add('hidden');
            this.app.node.appendChild(this.node);
            if (this.position) {
                // determine position of the menu
                if (this.transition === null) {
                    this.transition = 'fast';
                }
                let { x, y } = this.position;
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
        /** Locate at center. */
        center = true;
        /** Don't close when clicking blank area. */
        temp = false;
        /** Dialog caption. */
        caption = this.pane.addCaption('', true);
        /** Dialog text. */
        text = this.pane.addText('');
        /** Dialog buttons. */
        buttons = this.pane.add('bar');
        /** Name of the button clicked. */
        result = null;
        /** Faster transition. */
        transition = 'fast';
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

    class Sidebar extends Component {
        // header text
        header = this.ui.createElement('caption', this.node);
        ;
        // pane container
        pane = this.ui.create('pane', this.node);
        // pane footer
        footer = this.ui.createElement('caption.footer', this.node);
        init() {
            // header with text and back button
            this.pane.node.classList.add('scrolly');
            this.ui.createElement('span', this.header);
            this.ui.createElement('image', this.header);
            this.ui.createElement('span', this.footer);
        }
        /** Button at the top. */
        setHeader(caption, onclick) {
            this.ui.bindClick(this.header, onclick);
            this.header.firstChild.innerHTML = caption;
        }
        /** Button at the bottom. */
        setFooter(caption, onclick) {
            this.ui.bindClick(this.footer, onclick);
            this.footer.firstChild.innerHTML = caption;
        }
        /** Show button at the bottom. */
        showFooter() {
            this.node.classList.add('with-footer');
        }
        /** Hide button at the bottom. */
        hideFooter() {
            this.node.classList.remove('with-footer');
        }
    }

    class Arena extends Component {
        /** Layout mode. */
        layout = 0;
        /** Player that is under control. */
        perspective = 0;
        /** Card container. */
        cards = this.ui.createElement('cards');
        /** Player container. */
        players = this.ui.createElement('players');
        /** A dialog has been popped before this.remove() is called. */
        faded = false;
        /** Confirming exit. */
        confirming = false;
        /** Trying to exit. */
        exiting = false;
        init() {
            this.app.arena = this;
            this.app.node.appendChild(this.node);
            // make android back button function as returning to splash screen
            if (this.client.platform === 'Android' && history.state === null) {
                history.pushState('arena', '');
            }
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
        /** Remove with fade out animation. */
        remove() {
            if (this.app.arena === this) {
                this.app.arena = null;
                if (this.client.platform === 'Android' && history.state === 'arena') {
                    history.back();
                }
            }
            super.remove(new Promise(resolve => {
                this.ui.animate(this.node, {
                    opacity: [this.faded ? 'var(--app-blurred-opacity)' : 1, 0]
                }).onfinish = resolve;
            }));
        }
        /** Back to splash screen. */
        async back() {
            if (this.confirming || this.exiting) {
                return;
            }
            this.confirming = true;
            const ws = this.client.connection;
            const peers = this.client.peers;
            if (peers || ws instanceof WebSocket) {
                const content = ws instanceof WebSocket ? '确定退出当前房间？' : '当前房间有其他玩家，退出后将断开连接并请出所有其他玩家，确定退出当前模式？';
                if (!peers || peers.length <= 1 || await this.app.confirm('联机模式', { content, id: 'exitArena' })) {
                    if (peers && peers.length > 1) {
                        this.faded = true;
                    }
                    if (ws instanceof WebSocket) {
                        // leave currently connected room
                        ws.send('leave:init');
                        this.client.clear();
                    }
                    else {
                        // tell worker to close the room
                        this.remove();
                        this.client.send(-2, null, false);
                        this.exiting = true;
                        // force exit if worker doesn't respond within 0.5s
                        setTimeout(() => {
                            if (this.exiting) {
                                this.client.disconnect();
                            }
                        }, 500);
                    }
                }
                else {
                    this.confirming = false;
                }
            }
            else {
                this.client.disconnect();
            }
        }
        /** Connection status change. */
        $peers() {
            if (!this.client.peers && this.exiting) {
                // worker notifies that room successfully closed
                this.client.disconnect();
            }
            else {
                // wait until other properties have been updated
                setTimeout(() => this.client.trigger('sync'));
            }
        }
        $players(ids) {
            const nodes = new Set();
            // append players
            for (const id of ids) {
                const player = this.client.get(id);
                nodes.add(player.node);
                if (player.node.parentNode !== this.players) {
                    this.players.appendChild(player.node);
                }
                if (player.owner === this.client.uid) {
                    this.perspective = player.get('seat');
                }
            }
            // remove players that no longer exist
            for (const node of this.players.childNodes) {
                if (!nodes.has(node)) {
                    node.remove();
                }
            }
            // append player region
            if (!this.players.parentNode) {
                this.node.appendChild(this.players);
            }
        }
    }

    class Lobby extends Component {
        /** Sidebar for configurations. */
        sidebar = this.ui.create('sidebar', this.node);
        /** Player seats. */
        seats = this.ui.createElement('seats', this.node);
        /** Toggles for mode configuration. */
        configToggles = new Map();
        /** Toggles that show or hide based on other toggles. */
        configDynamicToggles = new Map();
        /** Toggles for hero packs. */
        heroToggles = new Map();
        /** Toggles for card packs. */
        cardToggles = new Map();
        /** Trying to connect to server. */
        connecting = false;
        /** Players in this seats. */
        players = [];
        /** Button to toggle spectating. */
        spectateButton = this.ui.createElement('widget.button');
        /** Container of spectators. */
        spectateDock = this.ui.createElement('dock');
        /** Button to choose hero. */
        heroButton = this.ui.createElement('widget.button');
        /** Container of chosen heros. */
        heroDock = this.ui.createElement('dock');
        init() {
            const arena = this.app.arena;
            arena.node.appendChild(this.node);
            this.client.listeners.sync.add(this);
            this.sidebar.ready.then(() => {
                this.sidebar.setHeader('返回', () => arena.back());
                this.sidebar.setFooter('开始游戏', () => this.respond());
            });
            this.sidebar.pane.node.classList.add('fixed');
            this.ui.animate(this.sidebar.node, { x: [-220, 0] });
            this.ui.animate(this.seats, { scale: ['var(--app-splash-transform)', 1], opacity: [0, 1] });
        }
        /** Update connected players. */
        sync() {
            const peers = this.client.peers;
            // callback for online mode toggle
            if (this.owner === this.client.uid) {
                this.yield(['sync', null, peers ? true : false]);
                if (this.connecting && !peers) {
                    this.app.alert('连接失败');
                }
                this.connecting = false;
                const toggle = this.configToggles.get('online');
                if (toggle) {
                    if (peers && peers.length > 1) {
                        toggle.confirm.set(false, ['联机模式', '当前房间有其他玩家，关闭后将断开连接并请出所有其他玩家，确定关闭联机模式？']);
                    }
                    else {
                        toggle.confirm.delete(false);
                    }
                }
            }
            // update seats
            const players = [];
            const spectators = [];
            for (const peer of peers || []) {
                if (peer.get('playing')) {
                    players.push(peer);
                }
                else {
                    spectators.push(peer);
                }
            }
            for (let i = 0; i < this.players.length; i++) {
                if (i < players.length) {
                    const peer = players[i];
                    this.players[i].set('heroImage', peer.get('avatar'));
                    this.players[i].set('heroName', peer.get('nickname'));
                }
                else {
                    this.players[i].set('heroImage', null);
                    this.players[i].set('heroName', null);
                }
            }
            // update spectate button
            const peer = this.client.peer;
            if (peer) {
                this.seats.classList.remove('offline');
                this.spectateButton.dataset.fill = peer.get('playing') ? '' : 'red';
                this.#alignAvatars(this.spectateDock, spectators.map(peer => peer.get('avatar')));
                this.#checkSpectate();
            }
            else {
                this.seats.classList.add('offline');
            }
        }
        /** Disable all toggles until command received from worker. */
        freeze() {
            this.sidebar.pane.node.classList.add('pending');
        }
        /** Re-enable toggles. */
        unfreeze() {
            this.sidebar.pane.node.classList.remove('pending');
        }
        /** Remove with fade and slide animation. */
        remove() {
            super.remove(new Promise(resolve => {
                let done = 0;
                const onfinish = () => {
                    if (++done === 2) {
                        resolve();
                    }
                };
                this.ui.animate(this.sidebar.node, { x: [0, -220] }, { fill: 'forwards' }).onfinish = onfinish;
                this.ui.animate(this.seats, { opacity: [1, 0] }, { fill: 'forwards' }).onfinish = onfinish;
            }));
        }
        $pane(configs) {
            // mode options
            this.sidebar.pane.addSection('选项');
            for (const name in configs.configs) {
                const config = configs.configs[name];
                const toggle = this.sidebar.pane.addToggle(config.name, result => {
                    this.freeze();
                    if (name === 'online' && result) {
                        this.connecting = true;
                        this.yield(['config', name, this.client.url]);
                    }
                    else {
                        this.yield(['config', name, result]);
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
            // heropacks
            this.sidebar.pane.addSection('武将');
            for (const name in configs.heropacks) {
                const toggle = this.sidebar.pane.addToggle(configs.heropacks[name], result => {
                    this.freeze();
                    this.yield(['hero', name, result]);
                });
                this.heroToggles.set(name, toggle);
            }
            // cardpacks
            this.sidebar.pane.addSection('卡牌');
            for (const name in configs.cardpacks) {
                const toggle = this.sidebar.pane.addToggle(configs.cardpacks[name], result => {
                    this.freeze();
                    this.yield(['card', name, result]);
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
            if (config.np) {
                // make sure npmax is set
                setTimeout(() => {
                    for (let i = 0; i < this.get('npmax'); i++) {
                        this.players[i].node.classList[i < config.np ? 'remove' : 'add']('blurred');
                    }
                    this.#checkSpectate();
                });
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
            // add player seats
            this.seats.innerHTML = '';
            this.players.length = 0;
            for (let i = 0; i < npmax; i++) {
                if (npmax > 4 && i === Math.ceil(npmax / 2)) {
                    this.seats.appendChild(document.createElement('div'));
                }
                const player = this.ui.create('player');
                this.players.push(player);
                this.seats.appendChild(player.node);
                this.ui.bindClick(player.node, () => {
                    if (this.owner !== this.client.uid) {
                        return;
                    }
                    const toggle = this.configToggles.get('np');
                    if (toggle) {
                        const nps = Array.from(toggle.choices.keys());
                        const idx = nps.indexOf(this.get('config').np);
                        const delta = player.node.classList.contains('blurred') ? 1 : -1;
                        const np = nps[idx + delta];
                        if (typeof np === 'number') {
                            this.yield(['config', 'np', np]);
                        }
                    }
                });
            }
            if (npmax > 4) {
                this.seats.classList.add('two-rows');
            }
            else {
                this.seats.classList.remove('two-rows');
            }
            // buttons below the seats
            const div = document.createElement('div');
            div.classList.add('bar');
            this.seats.appendChild(div);
            const bar = this.ui.createElement('bar');
            this.seats.classList.add('offline');
            this.seats.appendChild(bar);
            bar.appendChild(this.spectateDock);
            bar.appendChild(this.spectateButton);
            bar.appendChild(this.heroButton);
            bar.appendChild(this.heroDock);
            this.spectateButton.innerHTML = '旁观';
            this.heroButton.innerHTML = '点将';
            // toggle between spectator and player
            this.ui.bindClick(this.spectateButton, () => {
                if (this.spectateButton.dataset.fill === 'red') {
                    this.client.peer.yield('play');
                }
                else {
                    this.client.peer.yield('spectate');
                }
            });
        }
        /** Calculate the location of spectators and specified heros. */
        #alignAvatars(dock, names) {
            const frag = document.createDocumentFragment();
            const n = names.length;
            for (let i = 0; i < n; i++) {
                const img = this.ui.createElement('image.avatar');
                if (n < 4) {
                    img.style.left = `${230 / (n + 1) * (i + 1) - 20}px`;
                }
                else if (n === 4) {
                    const left = (230 - n * 40 - (n - 1) * 15) / 2;
                    img.style.left = `${left + i * 55}px`;
                }
                else {
                    img.style.left = `${190 / (n - 1) * i}px`;
                }
                this.ui.setImage(img, names[i]);
                frag.appendChild(img);
            }
            dock.replaceChildren(frag);
        }
        /** Enable or disable spectate button. */
        #checkSpectate() {
            if (!this.spectateButton.dataset.fill) {
                this.spectateButton.classList.remove('disabled');
            }
            else {
                const np = this.get('config').np;
                let n = 0;
                for (const player of this.players) {
                    if (player.get('heroName')) {
                        n++;
                    }
                }
                this.spectateButton.classList[n < np ? 'remove' : 'add']('disabled');
            }
        }
    }

    class Player extends Component {
        /** Player background. */
        background = this.ui.createElement('background', this.node);
        /** Main hero image. */
        heroImage = this.ui.createElement('image', this.background);
        /** Vice hero image. */
        viceImage = this.ui.createElement('image.vice', this.background);
        /** Container of name content. */
        content = this.ui.createElement('content', this.node);
        /** Main hero name. */
        heroName = this.ui.createElement('caption', this.content);
        /** Vice hero name. */
        viceName = this.ui.createElement('caption.vice', this.content);
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
        /** Background circle image. */
        background = this.ui.createElement('background', this.node);
        /** Background colored image. */
        image = this.ui.createElement('image', this.background);
        /** Text container. */
        content = this.ui.createElement('content', this.node);
        /** Click callback. */
        onclick = null;
        init() {
            this.ui.bindClick(this.node, () => {
                if (this.onclick) {
                    this.onclick();
                }
            });
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
            this.image.dataset.buttonicon = color;
        }
    }

    class Gallery extends Component {
        /** Child classes use tag <noname-gallery> by default. */
        static tag = 'gallery';
        /** Page container. */
        pages = this.ui.createElement('pages');
        /** Page indicator */
        indicator = this.ui.createElement('indicator');
        /** Number of rows. */
        nrows;
        /** Number of nodes in a row. */
        ncols;
        /** Number of pages. */
        #pageCount = 0;
        /** Index of current page. */
        #currentPage = -1;
        /** Rendered pages. */
        #rendered = new Set();
        /** Gallery items. */
        #items = [];
        /** Cache of item number per page. */
        #currentSize = null;
        /** Scroll mode.
         * true: for devices that can scroll horizontally, scroll with CSS snap.
         * false: for mouse wheels, scroll with transform animation.
         */
        #snap = this.client.mobile || this.db.get('snap') || false;
        /** Listener for wheel event. */
        #wheelListener = (e) => this.#wheel(e);
        init() {
            // enable horizontal scroll
            if (this.#snap) {
                this.switchToSnap();
            }
            else {
                this.node.addEventListener('wheel', this.#wheelListener, { passive: true });
            }
            this.node.appendChild(this.pages);
            this.node.appendChild(this.indicator);
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
        /** Add an item or an item constructor. */
        add(item) {
            // wrap item with container
            if (typeof item === 'function') {
                this.#items.push(item);
            }
            else {
                const container = this.ui.createElement('item');
                container.appendChild(item);
                this.#items.push(container);
            }
            // re-render current page
            this.updatePages();
            this.#rendered.delete(this.#pageCount - 1);
        }
        /** Get number of items per page. */
        getSize(recalc = false) {
            if (!recalc && this.#currentSize !== null) {
                return this.#currentSize[0] * this.#currentSize[1];
            }
            const calc = (n, full) => {
                const [ratio, margin, spacing, length] = n;
                return Math.floor((ratio * full - 2 * margin) / (length + spacing * 2));
            };
            const nrows = typeof this.nrows === 'number' ? this.nrows : calc(this.nrows, this.ui.height);
            const ncols = typeof this.ncols === 'number' ? this.ncols : calc(this.ncols, this.ui.width);
            this.#currentSize = [nrows, ncols];
            return nrows * ncols;
        }
        /** Update page count and create page(s) if necessary. */
        updatePages() {
            const pageCount = Math.ceil(this.#items.length / this.getSize());
            // add more pages
            while (pageCount > this.#pageCount) {
                this.pages.appendChild(this.ui.createElement('page'));
                const dot = this.ui.createElement('dot', this.indicator);
                if (pageCount === 1) {
                    dot.classList.add('current');
                }
                this.ui.createElement('layer', dot);
                this.ui.createElement('layer', dot);
                this.#pageCount++;
            }
            // remove extra pages
            while (pageCount < this.#pageCount) {
                this.pages.lastChild.remove();
                this.indicator.lastChild.remove();
                this.#pageCount--;
            }
            // show or hide page indicator
            this.node.classList[this.#pageCount > 1 ? 'add' : 'remove']('with-indicator');
        }
        /** Switch to snap mode. */
        switchToSnap() {
            this.pages.addEventListener('scroll', () => this.checkPage(), { passive: true });
            // enable scroll snapping
            this.pages.classList.add('snap');
            this.pages.classList.add('scrollx');
        }
        /** Update current page after reopening. */
        checkPage() {
            if (this.#snap) {
                const page = Math.round(this.pages.scrollLeft / this.node.offsetWidth);
                if (page !== this.#currentPage) {
                    this.turnPage(page);
                }
            }
            else if (this.#currentPage < 0) {
                this.turnPage(0);
            }
        }
        /** Update indicator and render nearby pages. */
        turnPage(page) {
            if (page >= this.#pageCount || page < 0) {
                return;
            }
            // update current page
            this.#currentPage = page;
            // create current and sibling pages
            this.#renderPage(page);
            this.#renderPage(page + 1);
            this.#renderPage(page - 1);
            // update page indicator
            this.indicator.querySelector('.current')?.classList.remove('current');
            this.indicator.childNodes[page].classList.add('current');
        }
        /** Callback when window resize. */
        resize() {
            if (!this.#currentSize) {
                this.getSize();
            }
            const [nrows, ncols] = this.#currentSize;
            this.getSize(true);
            if (nrows !== this.#currentSize[0] || ncols !== this.#currentSize[1]) {
                this.#rendered.clear();
                this.updatePages();
                if (this.#currentPage >= this.#pageCount) {
                    this.#currentPage = this.#pageCount - 1;
                }
                this.turnPage(this.#currentPage);
            }
        }
        /** Enable horizontal scroll with mouse wheel. */
        #wheel(e) {
            // ignore in snap mode
            if (this.#snap) {
                return;
            }
            // switch to snap mode after animation finishes
            if (e.deltaX !== 0) {
                this.#snap = true;
                this.db.set('snap', true);
                this.node.removeEventListener('wheel', this.#wheelListener);
                setTimeout(() => {
                    for (const anim of this.pages.getAnimations()) {
                        anim.cancel();
                    }
                    this.switchToSnap();
                    this.pages.scrollLeft = this.#currentPage * this.pages.offsetWidth;
                }, this.app.getTransition());
                return;
            }
            // turn page
            const width = this.pages.offsetWidth;
            let targetPage = this.#currentPage + e.deltaY / Math.abs(e.deltaY);
            if (targetPage < 0) {
                targetPage = 0;
                if (targetPage === this.#currentPage) {
                    return;
                }
            }
            else if (targetPage >= this.#pageCount) {
                targetPage = this.#pageCount - 1;
                if (targetPage === this.#currentPage) {
                    return;
                }
            }
            // start animation
            this.turnPage(targetPage);
            this.pages.animate([
                { transform: getComputedStyle(this.pages).transform },
                { transform: `translateX(${-targetPage * width}px)` }
            ], {
                duration: this.app.getTransition('fast'),
                fill: 'forwards'
            });
        }
        /** Render page when needed. */
        #renderPage(i) {
            const page = this.pages.childNodes[i];
            if (!page || this.#rendered.has(i)) {
                return;
            }
            this.#rendered.add(i);
            const n = this.getSize();
            const layer = this.ui.createElement('layer');
            for (let j = 0; j < n; j++) {
                const item = this.#items[i * n + j];
                if (j && j % this.#currentSize[1] === 0) {
                    layer.appendChild(document.createElement('div'));
                }
                if (typeof item === 'function') {
                    const container = this.ui.createElement('item');
                    const rendered = item();
                    if (rendered) {
                        container.appendChild(rendered);
                    }
                    this.#items[i * n + j] = container;
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
    }

    class Input extends Component {
        // <input> element
        input;
        // icon in <input>
        icon = this.ui.createElement('icon');
        // callback when blur or pressed enter
        callback = null;
        // callback when clicking icon
        onicon = null;
        init() {
            this.input = document.createElement('input');
            this.node.appendChild(this.input);
            this.node.appendChild(this.icon);
            // select all on focus
            this.input.onfocus = () => {
                if (!this.input.disabled && this.input.value.length) {
                    this.input.setSelectionRange(0, this.input.value.length);
                }
            };
            // clear selection and trigger callback on blur
            this.input.onblur = async () => {
                if (this.callback && !this.input.disabled) {
                    getSelection()?.removeAllRanges();
                    this.input.disabled = true;
                    await this.callback(this.input.value);
                    this.input.disabled = false;
                }
            };
            // blur when pressing enter
            this.input.onkeyup = e => {
                if (e.key === 'Enter') {
                    this.input.blur();
                }
            };
            // user native input in touch devices
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
            // callback when clicking icon
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
        /** Pane width for text alignment. */
        width = null;
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

    class Peer extends Component {
        $playing() {
            if (this.client.peer) {
                this.client.trigger('sync');
            }
        }
    }

    class SplashBar extends Component {
        /** Use tag <noname-bar>. */
        static tag = 'bar';
        /** Reference to Splash. */
        splash;
        /** Button names and components. */
        buttons = new Map();
        init() {
            // add buttons
            if (this.client.debug) {
                this.addButton('reset', '重置', 'red', () => this.#resetGame()).node.classList.remove('disabled');
                if (this.client.mobile) {
                    this.addButton('refresh', '刷新', 'purple', () => window.location.reload()).node.classList.remove('disabled');
                }
            }
            this.addButton('workshop', '扩展', 'yellow', () => { });
            this.addButton('hub', '联机', 'green', () => this.splash?.hub.open());
            this.addButton('settings', '选项', 'orange', () => this.splash?.settings.open());
        }
        /** Add a button. */
        addButton(id, caption, color, onclick) {
            const button = this.ui.create('button');
            button.update({ caption, color });
            button.onclick = onclick;
            button.node.classList.add('disabled');
            this.buttons.set(id, button);
            this.node.appendChild(button.node);
            return button;
        }
        async #resetGame() {
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
    }

    class SplashGallery extends Gallery {
        /** Reference to Splash. */
        splash;
        /** Single row. */
        nrows = 1;
        /** Extension index. */
        index;
        /** Ordered extension list. */
        extensions;
        async init() {
            // determine gallery column number
            const margin = parseInt(this.app.css.app['splash-margin']);
            this.ncols = [1, margin * 2, margin, parseInt(this.app.css.player.width)];
            super.init();
            // get modes
            this.index = await this.db.readFile('extensions/index.json') || {};
            this.extensions = await this.client.utils.readJSON('extensions/extensions.json');
            // udpate extension index
            let write = false;
            await Promise.all(this.extensions.map(async (name) => {
                if (!this.index[name]) {
                    await this.#loadExtension(name);
                    if (this.index[name]) {
                        write = true;
                    }
                }
            }));
            if (write) {
                await this.db.writeFile('extensions/index.json', this.index);
            }
            // add mode entries
            for (const name of this.extensions) {
                if (this.index[name]?.mode) {
                    this.add(() => this.addMode(name));
                }
            }
        }
        /** Add a mode to gallery. */
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
                if (this.splash.hidden) {
                    return;
                }
                this.client.connect([mode, this.#getPacks(mode)]);
                this.splash.hide();
            });
            return entry;
        }
        /** Get hero / card packages from target mode. */
        #getPacks(mode) {
            const packs = [];
            for (const name of this.extensions) {
                if (!this.index[name].pack) {
                    continue;
                }
                const modeTags = this.index[mode].tags;
                const packTags = this.index[name].tags;
                if (this.#checkTags(modeTags, packTags) && this.#checkTags(packTags, modeTags)) {
                    packs.push(name);
                }
            }
            return packs;
        }
        /** Check if tags2 has all required tags of tags1. */
        #checkTags(tags1, tags2) {
            if (!tags1) {
                return true;
            }
            for (const tag of tags1) {
                if (tag.endsWith('!')) {
                    if (!tags2) {
                        return false;
                    }
                    if (!tags2.includes(tag) && !tags2.includes(tag.slice(0, -1))) {
                        return false;
                    }
                }
            }
            return true;
        }
        /** Get mode information from extensions. */
        async #loadExtension(name) {
            if (this.index[name]) {
                return;
            }
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

    class SplashHub extends Popup {
        /** Portrait sized popup. */
        size = 'portrait';
        /** Room widgets. */
        rooms = new Map();
        /** Number of online clients. */
        numSection;
        /** Room widget container. */
        roomGroup = this.ui.createElement('rooms.hidden');
        /** Caption container. */
        caption = this.ui.createElement('caption.hidden');
        /** Avatar image. */
        avatarImage;
        /** nickname input */
        nickname = this.ui.create('input');
        /** address input */
        address = this.ui.create('input');
        /** Mode gallery for reference to extension index. */
        gallery;
        /** Popup for avatar selection. */
        avatarSelector = null;
        /** Called by app after UI loaded. */
        create(splash) {
            // nickname, avatar and this address
            this.#addInfo();
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
                        await this.#connect();
                        this.address.input.disabled = false;
                    }
                }, 500);
            };
            this.onclose = () => {
                splash.node.classList.remove('blurred');
                this.avatarSelector?.close();
            };
            // enable button click after creation finish
            splash.bar.buttons.get('hub').node.classList.remove('disabled');
            this.gallery = splash.gallery;
        }
        /** Disconnected or kicked out of room. */
        async reload(msg) {
            const [reason, content] = this.client.utils.split(msg);
            this.#clearRooms();
            this.edit(content);
            if (this.app.arena) {
                if (reason === 'kick') {
                    await this.app.alert('你被请出了房间');
                }
                else if (reason === 'end') {
                    await this.app.alert('房间已关闭');
                }
                this.app.arena.faded = true;
                this.client.clear();
            }
            this.roomGroup.classList.remove('entering');
            this.roomGroup.classList.remove('hidden');
        }
        /** Room info update. */
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
                        const room = this.#createRoom(JSON.parse(rooms[uid]));
                        this.rooms.set(uid, room);
                        this.ui.bindClick(room, () => {
                            if (!this.roomGroup.classList.contains('entering')) {
                                this.roomGroup.classList.add('entering');
                                ws.send('join:' + uid);
                            }
                        });
                        this.roomGroup.appendChild(room);
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
        /** Online client number update. */
        num(msg) {
            this.numSection.classList.remove('hidden');
            this.numSection.firstChild.innerHTML = '在线：' + msg;
        }
        /** Message received from the owner of joined room. */
        msg(msg) {
            this.client.dispatch(JSON.parse(msg));
            if (!this.app.splash.hidden) {
                this.app.splash.hide(true);
                this.close();
            }
        }
        /** Owner of joined room disconnected. */
        down(msg) {
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
                if (val === true && ws === this.client.connection && ws instanceof WebSocket) {
                    if (this.app.arena) {
                        this.app.arena.faded = true;
                        this.client.clear();
                    }
                    ws.send('leave:init');
                }
            });
        }
        /** Connect to hub. */
        #connect() {
            try {
                if (!this.address.input.value) {
                    this.db.set('ws', null);
                    return;
                }
                this.client.connect('wss://' + this.address.input.value);
                this.address.set('icon', 'clear');
                const ws = this.client.connection;
                this.#setCaption('正在连接');
                return new Promise(resolve => {
                    ws.onclose = () => {
                        this.#disconnect(this.client.connection === ws);
                        setTimeout(resolve, 100);
                    };
                    ws.onopen = () => {
                        this.address.set('icon', 'ok');
                        this.#setCaption('');
                        ws.send('init:' + JSON.stringify([this.client.uid, this.client.info]));
                        if (this.address.input.value !== config.ws) {
                            this.db.set('ws', this.address.input.value);
                        }
                    };
                    ws.onmessage = ({ data }) => {
                        try {
                            const [method, arg] = this.client.utils.split(data);
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
                this.#disconnect(true);
            }
        }
        /** Disconnect from hub. */
        #disconnect(client) {
            if (client) {
                this.client.disconnect();
            }
            this.#clearRooms();
            this.address.set('icon', null);
            this.#setCaption('已断开');
        }
        /** Remove room list. */
        #clearRooms() {
            for (const room of this.rooms.values()) {
                room.remove();
            }
            this.rooms.clear();
        }
        /** Show current connection status. */
        #setCaption(caption) {
            this.numSection.classList.add('hidden');
            this.roomGroup.classList.add('hidden');
            if (caption) {
                this.caption.innerHTML = caption;
            }
            this.caption.classList[caption ? 'remove' : 'add']('hidden');
        }
        /** Update nickname or avatar. */
        #sendInfo() {
            if (this.client.connection instanceof WebSocket) {
                this.client.connection.send('set:' + JSON.stringify(this.client.info));
            }
        }
        /** Create a room entry. */
        #createRoom([name, np, npmax, [nickname, avatar], state]) {
            const room = this.ui.createElement('widget');
            /** Avatar image. */
            const avatarNode = this.ui.createElement('image.avatar', room);
            this.ui.setImage(avatarNode, avatar);
            /** Mode name. */
            const captionNode = this.ui.createElement('caption', room);
            captionNode.innerHTML = name;
            /** Status text. */
            const statusNode = this.ui.createElement('span', room);
            const stateText = state ? '游戏中' : '等待中';
            statusNode.innerHTML = `<noname-status data-state="${state}"></noname-status> ${stateText} ${Math.min(np, npmax)} / ${npmax}`;
            /** Nickname text. */
            const nicknameNode = this.ui.createElement('span.nickname', room);
            nicknameNode.innerHTML = `<noname-image></noname-image>${nickname}`;
            return room;
        }
        /** Select avatar. */
        #createSelector() {
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
                    const node = this.ui.createElement('image.avatar');
                    this.ui.setImage(node, img);
                    this.ui.bindClick(node, () => {
                        this.ui.setImage(this.avatarImage, img);
                        this.db.set('avatar', img);
                        this.#sendInfo();
                        popup.close();
                    });
                    return node;
                });
            }
        }
        /** Add avatar and input. */
        #addInfo() {
            const group = this.pane.add('group');
            // avatar
            const avatarNode = this.ui.createElement('widget', group);
            const img = this.avatarImage = this.ui.createElement('image.avatar', avatarNode);
            const url = this.db.get('avatar') ?? config.avatar;
            this.ui.setImage(img, url);
            this.ui.bindClick(avatarNode, () => {
                if (this.hidden) {
                    return;
                }
                if (!this.avatarSelector) {
                    this.#createSelector();
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
                    this.#sendInfo();
                }
            };
            // address input
            this.ui.createElement('span.address', group).innerHTML = '地址';
            const address = this.address = this.ui.create('input', group);
            address.node.classList.add('address');
            address.ready.then(() => {
                address.input.value = this.client.url;
            });
            address.callback = () => this.#connect();
            this.ui.bindClick(address.node, e => {
                const ws = this.client.connection;
                if (address.input.disabled && ws instanceof WebSocket) {
                    const menu = this.ui.create('popup');
                    menu.position = e;
                    menu.pane.addOption('断开', () => {
                        if (ws === this.client.connection) {
                            ws.close();
                        }
                        menu.close();
                    });
                    menu.onclose = () => address.node.classList.remove('defer');
                    address.node.classList.add('defer');
                    menu.open();
                }
            });
        }
    }

    class SplashSettings extends Popup {
        /** Portrait sized popup. */
        size = 'portrait';
        /** Gallery column number. */
        ncols = 3;
        /** All galleries. */
        galleries = new Set();
        /** Currently rotating music nodes. */
        #rotating = null;
        /** Animation of this.rotating. */
        #rotatingAnimation = null;
        /** Called by app after UI loaded. */
        create(splash) {
            // blur or unblur splash
            this.onopen = () => {
                for (const gallery of this.galleries) {
                    gallery.checkPage();
                }
                splash.node.classList.add('blurred');
                if (this.#rotating) {
                    this.#rotate(this.#rotating);
                }
            };
            this.onclose = () => {
                splash.node.classList.remove('blurred');
                this.#rotatingAnimation?.pause();
            };
            // add main content
            this.#addGallery('theme', '主题', '⊕ 添加背景', () => this.#addTheme());
            this.#addGallery('bg', '背景', '⊕ 添加背景', () => this.#addBackground());
            this.#addGallery('bgm', '音乐', '+', () => this.#addMusic());
            // enable button click after creation finish
            splash.bar.buttons.get('settings').node.classList.remove('disabled');
        }
        #addGallery(section, caption, add, onadd) {
            this.pane.addSection(caption);
            const items = Array.from(Object.keys(this.app.assets[section]));
            let gallery;
            if (section === 'bgm') {
                //  6-column music gallery with volume sliders
                this.#addSliders();
                gallery = this.pane.addGallery(1, this.ncols * 2);
                gallery.node.classList.add('music');
            }
            else {
                // 3-column theme / background gallery
                gallery = this.pane.addGallery(1, this.ncols);
            }
            this.galleries.add(gallery);
            // add gallery items
            for (const item of items) {
                gallery.add(() => this.#addItem(item, section));
            }
            // add button
            gallery.add(() => {
                const node = this.ui.createElement('widget.sharp');
                const content = this.ui.createElement('content', node);
                this.ui.createElement('caption', content).innerHTML = add;
                this.ui.bindClick(node, onadd);
                return node;
            });
        }
        /** Add volume sliders. */
        #addSliders() {
            const volGallery = this.pane.addGallery(1, 2);
            volGallery.node.classList.add('volume');
            volGallery.add(this.#createSlider('音乐音量：', 'music-volume'));
            volGallery.add(this.#createSlider('音效音量：', 'audio-volume'));
            this.galleries.add(volGallery);
        }
        /** Create a volume slider. */
        #createSlider(caption, key) {
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
                        this.app.changeVolume(vol);
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
        /** Add a gallery item. */
        #addItem(item, section) {
            const node = this.ui.createElement('widget.sharp');
            const src = `assets/${section}/${item}` + (section === 'theme' ? '/theme' : '');
            this.ui.setBackground(this.ui.createElement('image', node), src);
            // border for current active option
            if (item === this.db.get(section)) {
                node.classList.add('active');
            }
            if (section === 'bgm') {
                // set background music
                if (item === this.db.get('bgm-splash')) {
                    this.#rotating = node;
                }
                this.ui.bindClick(node, e => this.#musicMenu(node, item, e));
            }
            else {
                this.ui.bindClick(node, () => this.#clickItem(node, item, section));
            }
            return node;
        }
        /** Callback when clicking theme or background entry. */
        #clickItem(node, item, section) {
            if (item !== this.db.get(section)) {
                // change theme or background
                node.parentNode?.parentNode?.parentNode?.parentNode?.querySelector('noname-widget.active')?.classList.remove('active');
                node.classList.add('active');
                this.db.set(section, item);
                this.app[section === 'bg' ? 'loadBackground' : 'loadTheme']();
            }
            else if (section === 'bg') {
                // unset background
                node.classList.remove('active');
                this.db.set('bg', null);
                this.app.loadBackground();
            }
        }
        /** Open menu when clicking on music gallery. */
        #musicMenu(node, bgm, e) {
            const rotating_bak = [this.#rotating, this.#rotatingAnimation];
            this.app.switchMusic(bgm);
            const menu = this.ui.create('popup');
            this.#rotate(node);
            // restore rotation animation of previous splash music
            const restore = () => {
                if (rotating_bak[0] && rotating_bak[0] !== node) {
                    this.#rotating = rotating_bak[0];
                    this.#rotatingAnimation = rotating_bak[1];
                    if (this.#rotatingAnimation) {
                        this.#rotatingAnimation.play();
                    }
                    else {
                        this.#rotate(this.#rotating);
                    }
                }
                this.app.playMusic();
            };
            // callback for clicking on menu entry
            const clickOption = (splash, game) => {
                this.#rotateMusic(node, bgm, splash, game);
                menu.onclose = null;
                menu.close();
            };
            menu.pane.addOption('等待音乐', () => clickOption(true, false));
            menu.pane.addOption('游戏音乐', () => { clickOption(false, true); restore(); });
            menu.pane.addOption('全部应用', () => clickOption(true, true));
            menu.onclose = () => { this.#rotateMusic(node, bgm, false, false); restore(); };
            menu.position = e;
            menu.open();
        }
        /** Create rotation animation for music selector. */
        #rotate(node) {
            if (this.#rotating !== node) {
                this.#rotatingAnimation?.pause();
            }
            // current node animation
            const animation = this.#rotating === node ? this.#rotatingAnimation : node.getAnimations()[0];
            this.#rotating = node;
            if (animation) {
                // start current animation
                this.#rotatingAnimation = animation;
                animation.play();
            }
            else {
                // create new animation
                this.#rotatingAnimation = node.animate([
                    { transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }
                ], {
                    duration: 10000,
                    iterations: Infinity
                });
            }
        }
        /** Rotate / highlight music gallery item. */
        #rotateMusic(node, bgm, splash, game) {
            if (splash) {
                // set as splash bgm
                this.#rotate(node);
                this.db.set('bgm-splash', bgm);
            }
            else {
                // unset splash bgm
                if (this.#rotating === node) {
                    this.#rotatingAnimation?.pause();
                    this.#rotating = null;
                    this.#rotatingAnimation = null;
                }
                if (this.db.get('bgm-splash') === bgm) {
                    this.db.set('bgm-splash', 'none');
                }
            }
            if (game) {
                // set as game bgm
                node.parentNode?.parentNode?.parentNode?.parentNode?.querySelector('noname-widget.active')?.classList.remove('active');
                node.classList.add('active');
                this.db.set('bgm', bgm);
            }
            else {
                // unset game bgm
                node.classList.remove('active');
                if (this.db.get('bgm') === bgm) {
                    this.db.set('bgm', 'none');
                }
            }
        }
        #addTheme() { }
        #addBackground() { }
        #addMusic() { }
    }

    class Splash extends Component {
        // gallery of modes
        gallery = this.ui.create('splash-gallery');
        // bottom toolbar
        bar = this.ui.create('splash-bar');
        // settings menu
        settings = this.ui.create('splash-settings');
        // hub menu
        hub = this.ui.create('splash-hub');
        // currently hidden
        hidden = true;
        init() {
            // create mode selection gallery
            this.gallery.splash = this;
            this.node.appendChild(this.gallery.node);
            // bottom button bar
            this.bar.splash = this;
            this.node.appendChild(this.bar.node);
            // debug mode
            if (this.client.debug && this.client.mobile) {
                const script = document.createElement('script');
                script.src = 'lib/eruda/eruda.js';
                script.onload = () => window.eruda.init();
                document.head.appendChild(script);
            }
        }
        hide(faded = false) {
            if (this.hidden) {
                return;
            }
            this.hidden = true;
            this.ui.animate(this.node, {
                scale: [faded ? 'var(--app-splash-transform)' : 1, 'var(--app-splash-transform)'],
                opacity: [faded ? 'var(--app-blurred-opacity)' : 1, 0]
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
        /** Caption text. */
        span = this.ui.createElement('span', this.node);
        /** Switcher text. */
        text;
        /** Choices. */
        choices;
        /** Disabled choices. */
        disabledChoices = new Set();
        /** Requires confirmation when toggling to a value. */
        confirm = new Map();
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
    componentClasses.set('sidebar', Sidebar);
    componentClasses.set('arena', Arena);
    componentClasses.set('lobby', Lobby);
    componentClasses.set('player', Player);
    componentClasses.set('button', Button);
    componentClasses.set('gallery', Gallery);
    componentClasses.set('input', Input);
    componentClasses.set('pane', Pane);
    componentClasses.set('peer', Peer);
    componentClasses.set('popup', Popup);
    componentClasses.set('splash-bar', SplashBar);
    componentClasses.set('splash-gallery', SplashGallery);
    componentClasses.set('splash-hub', SplashHub);
    componentClasses.set('splash-settings', SplashSettings);
    componentClasses.set('splash', Splash);
    componentClasses.set('toggle', Toggle);

    /** Callback for dom events. */
    class Binding {
        // current offset
        offset = null;
        // maximium offset
        movable = null;
        // move callback for pointermove
        onmove = null;
        // move callback for pointermove outside the range
        onoff = null;
        // move callback for pointerup
        onmoveend = null;
        // click callback for pointerup
        onclick = null;
        // callback for pointerdown
        ondown = null;
    }
    class UI {
        /** App width. */
        width;
        /** App height. */
        height;
        /** Current zoom level. */
        zoom = 1;
        /** Resolved when ready. */
        ready;
        /** Root component. */
        app;
        /** Client object. */
        #client;
        /** Database object. */
        #db;
        // temperoary disable event trigger after pointerup to prevent unintended clicks
        #dispatched = false;
        /** Bindings for DOM events. */
        #bindings = new Map();
        // clicking[0]: element that is clicked
        // clicking[1]: location of pointerdown
        // clicking[2]: started by a touch event
        #clicking = null;
        // moving[0]: element that is moved
        // moving[1]: location of pointerdown
        // moving[2]: initial transform of target element when pointerdown is fired
        // moving[3]: return value of the binding.onmove
        // moving[4]: started by a touch event
        #moving = null;
        constructor(client, db) {
            this.#client = client;
            this.#db = db;
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
                document.body.addEventListener('touchmove', e => this.#pointerMove(e.touches[0], true), { passive: true });
                document.body.addEventListener('touchend', () => this.#pointerEnd(true), { passive: true });
                document.body.addEventListener('touchcancel', () => this.#pointerCancel(true), { passive: true });
                if (this.#client.platform !== 'Android') {
                    document.body.addEventListener('mousemove', e => this.#pointerMove(e, false), { passive: true });
                    document.body.addEventListener('mouseup', () => this.#pointerEnd(false), { passive: true });
                    document.body.addEventListener('mouseleave', () => this.#pointerCancel(false), { passive: true });
                }
                this.app = this.create('app');
            });
        }
        /** Create new component. */
        create(tag, parent = null, id = null) {
            const cls = componentClasses.get(tag);
            const cmp = new cls(this.#client, this.#db, this, cls.tag || tag, id);
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
        /** Set binding for ClickEvent. */
        bindClick(node, onclick) {
            // get or create registry for node
            const binding = this.#bindings.get(node) || this.#register(node);
            // bind click event
            binding.onclick = onclick;
        }
        /** Set binding for MoveEvent. */
        bindMove(node, config) {
            // get or create registry for node
            const binding = this.#bindings.get(node) || this.#register(node);
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
            const binding = this.#bindings.get(node);
            if (binding && binding.onclick) {
                if (this.#clicking && this.#clicking[0] === node) {
                    // use the location of this.#clicking if applicable
                    binding.onclick.call(node, this.#clicking[1]);
                }
                else {
                    // a pseudo click event without location info
                    binding.onclick.call(node, { x: 0, y: 0 });
                }
            }
            // avoid duplicate trigger
            this.#resetClick(node);
            this.#resetMove(node);
        }
        /** Fire move event. */
        dispatchMove(node, location) {
            const binding = this.#bindings.get(node);
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
                    // save move state to this.#moving if applicable
                    if (this.#moving && this.#moving[0] === node) {
                        this.#moving[3] = state;
                    }
                }
            }
        }
        /** Fire moveend event. */
        dispatchMoveEnd(node) {
            // onmoveend
            const binding = this.#bindings.get(node);
            if (binding && binding.onmoveend) {
                if (this.#moving && this.#moving[0] === node) {
                    // pass the state of this.#moving if applicable
                    binding.onmoveend(this.#moving[3]);
                }
                else {
                    // a pseudo moveend event without current state
                    binding.onmoveend(null);
                }
            }
            // avoid duplicate trigger
            this.#resetClick(node);
            this.#resetMove(node);
        }
        /** Wrapper of HTMLElement.animate(). */
        animate(node, animation, config) {
            const keyframes = [];
            let length = 0;
            for (const key in animation) {
                if (Array.isArray(animation[key])) {
                    length = Math.max(length, animation[key].length);
                }
            }
            for (let i = 0; i < length; i++) {
                const frame = {};
                if (animation.x) {
                    frame.transform = `translateX(${animation.x[i]}px)`;
                }
                if (animation.y) {
                    frame.transform = (frame.transform || '') + ` translateY(${animation.y[i]}px)`;
                }
                if (animation.scale) {
                    frame.transform = (frame.transform || '') + ` scale(${animation.scale[i]})`;
                }
                if (animation.opacity) {
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
        // get the location of mouse or touch event
        #locate(e) {
            return {
                x: Math.round(e.clientX / this.zoom),
                y: Math.round(e.clientY / this.zoom)
            };
        }
        // register pointerdown for click or move
        #register(node) {
            // event callback
            const binding = new Binding();
            this.#bindings.set(node, binding);
            // register event
            const dispatchDown = (e, touch) => {
                const origin = this.#locate(e);
                // initialize click event
                if (binding.onclick && !this.#clicking) {
                    node.classList.add('clickdown');
                    this.#clicking = [node, origin, touch];
                }
                // initialize move event
                if (binding.movable && !this.#moving) {
                    this.#moving = [node, origin, binding.offset || { x: 0, y: 0 }, null, touch];
                    // fire ondown event
                    if (binding.ondown) {
                        binding.ondown(origin);
                    }
                }
            };
            node.addEventListener('touchstart', e => dispatchDown(e.touches[0], true), { passive: true });
            if (this.#client.platform !== 'Android') {
                node.addEventListener('mousedown', e => dispatchDown(e, false), { passive: true });
            }
            return binding;
        }
        // cancel click callback for current pointerdown
        #resetClick(node) {
            if (this.#clicking && this.#clicking[0] === node) {
                this.#clicking = null;
            }
            node.classList.remove('clickdown');
        }
        // cancel move callback for current pointerdown
        #resetMove(node) {
            if (this.#moving && this.#moving[0] === node) {
                this.#moving = null;
            }
        }
        // callback for mousemove or touchmove
        #pointerMove(e, touch) {
            const { x, y } = this.#locate(e);
            // not a click event if move distance > 5px
            if (this.#clicking && this.#clicking[2] === touch) {
                const [node, origin] = this.#clicking;
                const dx = origin.x - x;
                const dz = origin.y - y;
                if (dx * dx + dz * dz > 25) {
                    this.#resetClick(node);
                }
            }
            // get offset and trigger move event
            if (this.#moving && this.#moving[4] === touch) {
                const [node, origin, offset] = this.#moving;
                this.dispatchMove(node, {
                    x: x - origin.x + offset.x,
                    y: y - origin.y + offset.y
                });
            }
        }
        // callback for mouseup or touchend
        #pointerEnd(touch) {
            if (this.#dispatched === false) {
                // dispatch events
                if (this.#clicking && this.#clicking[2] === touch) {
                    this.#dispatched = true;
                    this.dispatchClick(this.#clicking[0]);
                }
                if (this.#moving && this.#moving[4] === touch) {
                    this.#dispatched = true;
                    this.dispatchMoveEnd(this.#moving[0]);
                }
                // re-enable event trigger after 200ms
                if (this.#dispatched) {
                    window.setTimeout(() => this.#dispatched = false, 200);
                }
            }
            if (this.#clicking && this.#clicking[2] === touch) {
                this.#clicking = null;
            }
            if (this.#moving && this.#moving[4] === touch) {
                this.#moving = null;
            }
        }
        // callback for mouseleave or touchcancel
        #pointerCancel(touch) {
            if (this.#clicking && this.#clicking[2] === touch) {
                this.#clicking[0].classList.remove('clickdown');
            }
            if (this.#moving && this.#moving[4] === touch) {
                this.dispatchMoveEnd(this.#moving[0]);
            }
            this.#clicking = null;
            this.#moving = null;
        }
    }

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
    /** Return a promise that resolves after n seconds. */
    function sleep(n) {
        return new Promise(resolve => setTimeout(resolve, n * 1000));
    }
    /** Generate a unique ID based on current Date.now().
     * Mapping: Date.now(): [0-9] -> [0-62] -> [A-Z] | [a-z] | [0-9]
     */
    function uid() {
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

    var utils = /*#__PURE__*/Object.freeze({
        __proto__: null,
        copy: copy,
        apply: apply,
        freeze: freeze,
        access: access,
        split: split,
        sleep: sleep,
        uid: uid,
        readJSON: readJSON
    });

    /**
     * Executor of worker commands.
     */
    class Client {
        /** Debug mode */
        debug = false;
        /** Client version. */
        #version = version;
        /** Worker object. */
        #connection = null;
        /** Service worker. */
        #registration = null;
        /** User identifier. */
        #uid;
        /** IndexedDB manager. */
        #db = new Database();
        /** Component manager. */
        #ui;
        /** Module containing JS utilities. */
        #utils = utils;
        /** Components synced with the worker. */
        #components = new Map();
        /** ID of current stage. */
        #stageID = 0;
        /**  UITicks waiting for dispatch. */
        #ticks = [];
        /** Timestamp of the last full UI load. */
        #loaded = 0;
        /** This.#loop is not running. */
        #paused = true;
        /** Event listeners. */
        #listeners = Object.freeze({
            // connection status change
            sync: new Set(),
            // document resize
            resize: new Set(),
            // keyboard event
            key: new Set(),
            // stage change
            stage: new Set()
        });
        get version() {
            return this.#version;
        }
        get connection() {
            return this.#connection;
        }
        get registration() {
            return this.#registration;
        }
        get uid() {
            return this.#uid;
        }
        get utils() {
            return this.#utils;
        }
        get listeners() {
            return this.#listeners;
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
        /** Client is mobile platform. */
        get mobile() {
            return ['iOS', 'Android'].includes(this.platform) && 'ontouchend' in document;
        }
        /** Initialization message. */
        get info() {
            return [
                this.#db.get('nickname') || config.nickname,
                this.#db.get('avatar') || config.avatar
            ];
        }
        /** WebSocket address. */
        get url() {
            return this.#db.get('ws') || config.ws;
        }
        /** Connected remote clients. */
        get peers() {
            const ids = this.#ui.app?.arena?.get('peers');
            if (!ids) {
                return null;
            }
            const peers = [];
            for (const id of ids) {
                const cmp = this.#components.get(id);
                if (cmp) {
                    peers.push(cmp);
                }
            }
            return peers;
        }
        /** Peer component representing current client. */
        get peer() {
            for (const peer of this.peers || []) {
                if (peer.owner === this.uid) {
                    return peer;
                }
            }
            return null;
        }
        constructor() {
            this.#ui = new UI(this, this.#db);
            // get user identifier
            this.#db.ready.then(() => {
                if (!this.#db.get('uid')) {
                    this.#db.set('uid', this.utils.uid());
                }
                this.#uid = this.#db.get('uid');
            });
            // register service worker for PWA
            navigator.serviceWorker?.register('/service.js').then(reg => {
                this.#registration = reg;
            });
        }
        /** Connect to a game server. */
        connect(config) {
            this.disconnect();
            if (Array.isArray(config)) {
                const worker = this.#connection = new Worker(`dist/worker.js`, { type: 'module' });
                worker.onmessage = ({ data }) => {
                    if (data === 'ready') {
                        worker.onmessage = ({ data }) => this.dispatch(data);
                        config.push(this.#db.get(config[0] + ':disabledHeropacks') || []);
                        config.push(this.#db.get(config[0] + ':disabledCardpacks') || []);
                        config.push(this.#db.get(config[0] + ':config') || {});
                        config.push(this.info);
                        this.send(0, config, true);
                    }
                };
            }
            else {
                this.#connection = new WebSocket(config);
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
            this.#connection = null;
            this.clear();
        }
        /** Clear currently connection status without disconnecting. */
        clear(back = true) {
            for (const cmp of this.#components.values()) {
                this.#removeListeners(cmp);
            }
            this.#components.clear();
            this.#ui.app.clearPopups();
            this.#ui.app.arena?.remove();
            this.#ui.app.arena = null;
            if (back) {
                this.#ui.app.splash.show();
                this.#stageID = 0;
            }
        }
        /**
         * Send component return value to worker.
         * @param {number} id - ID of component (id > 0).
         * @param {any} result - Return value of component.
         * @param {boolean} done - true: component.respond(); false: component.yield()
         * Special ID:
         * 0: Initialize worker and create worker.#game.
         * -1: Reload due to UI error.
         * -2: Tell worker to disconnect from hub
         */
        send(id, result, done) {
            const msg = [this.uid, this.#stageID, id, result, done];
            if (this.connection instanceof Worker) {
                this.connection.postMessage(msg);
            }
            else if (this.connection instanceof WebSocket) {
                this.connection.send('resp:' + JSON.stringify(msg));
            }
        }
        /** Add a UITick to render queue. */
        dispatch(data) {
            this.#ticks.push(data);
            if (this.#paused) {
                this.#loop();
            }
        }
        /** Trigger a listener. */
        trigger(event, arg) {
            for (const cmp of this.listeners[event]) {
                cmp[event](arg);
            }
        }
        /** Get component by ID. */
        get(id) {
            return this.#components.get(id);
        }
        /**
         * Render the next UITick.
         */
        async #render() {
            const tick = this.#ticks.shift();
            try {
                // check if tick is a full UI reload
                const [sid, tags, props, calls] = tick;
                for (const key in tags) {
                    if (tags[key] === 'arena') {
                        const arena = this.#ui.app.arena;
                        if (arena && this.#ui.app.popups.size) {
                            arena.faded = true;
                        }
                        this.clear(false);
                        this.#loaded = Date.now();
                        if (arena) {
                            await this.#ui.app.sleep('fast');
                        }
                        break;
                    }
                }
                if (!this.#loaded) {
                    throw ('UI not loaded');
                }
                // clear unfinished function calls (e.g. selectCard / selectTarget)
                if (sid !== this.#stageID) {
                    this.trigger('stage');
                    this.listeners.stage.clear();
                    this.#stageID = sid;
                }
                // create new components
                const newComponents = [];
                for (const key in tags) {
                    const id = parseInt(key);
                    const tag = tags[key];
                    if (typeof tag === 'string') {
                        this.#components.get(id)?.remove();
                        const cmp = this.#ui.create(tag, null, id);
                        this.#components.set(id, cmp);
                        newComponents.push(cmp.ready);
                    }
                }
                await Promise.all(newComponents);
                // update component properties
                let hooks = [];
                for (const key in props) {
                    hooks = hooks.concat(this.#components.get(parseInt(key)).update(props[key], false));
                }
                for (const [hook, cmp, newVal, oldVal] of hooks) {
                    hook.apply(cmp, [newVal, oldVal]);
                }
                // call component methods
                for (const key in calls) {
                    const id = parseInt(key);
                    for (const [method, arg] of calls[key]) {
                        this.#components.get(id)[method](arg);
                    }
                }
                // delete components
                for (const key in tags) {
                    const id = parseInt(key);
                    if (tags[key] === null) {
                        const cmp = this.#components.get(id);
                        if (cmp) {
                            this.#removeListeners(cmp);
                            this.#components.delete(id);
                            cmp.remove();
                        }
                    }
                }
            }
            catch (e) {
                console.log(e);
                if (Date.now() - this.#loaded < 500) {
                    // prompt reload if error occus within 0.5s after reload
                    this.#loaded = 0;
                    this.#ui.app.confirm('游戏错误', { content: '点击“确定”重新载入游戏，点击“取消”尝试继续。' }).then(reload => {
                        if (reload === true) {
                            window.location.reload();
                        }
                        else if (reload === false) {
                            this.send(-1, null, false);
                        }
                    });
                }
                else if (this.#loaded) {
                    // tell worker to reload UI
                    this.#loaded = 0;
                    this.send(-1, null, false);
                }
            }
        }
        /** Render UITick(s). */
        async #loop() {
            if (this.#paused) {
                this.#paused = false;
                while (this.#ticks.length) {
                    await this.#render();
                }
                this.#paused = true;
            }
        }
        /** Remove all listeners. */
        #removeListeners(cmp) {
            for (const key in this.listeners) {
                this.listeners[key].delete(cmp);
            }
        }
    }

    const client = new Client();
    client.debug = true;
    globalThis.client = client;

}());
