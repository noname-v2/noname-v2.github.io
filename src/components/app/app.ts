import { Component, Arena, Splash, Popup, TransitionDuration } from '../../components';
import type { Dict } from '../../utils';

interface DialogOptions {
    buttons?: [string, string, string?][];
    content?: string;
    id?: string;
    timeout?: number;
}

interface ConfirmOptions extends DialogOptions {
    ok?: string;
    cancel?: string;
}

export class App extends Component {
    /** Arena component. */
    arena: Arena | null = null;

    /** Splash component. */
    splash!: Splash;

    /** Transition durations. */
    css: Dict<Dict<string>> = {};

    /** Index of assets. */
    assets!: Dict<Dict<string>>;

    /** Stylesheet for theme. */
    themeNode = document.createElement('style');

    /** Node for displaying background. */
    bgNode = this.ui.createElement('background', this.node);

    /** Node for playing background music. */
    bgmNode = document.createElement('audio');

    /** Background music volume control. */
    bgmGain!: AudioParam;

    /** Audio context. */
    audio = new (window.AudioContext || (window as any).webkitAudioContext)();

    /** Popup components cleared when arena close. */
    popups = new Map<string | number, Popup>();

    /** Count dialog for dialog ID */
    private dialogCount = 0;

    /** Initialize volume settings. */
    private initAudio() {
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
    private async initAssets() {
        this.assets = await this.client.readJSON('assets/index.json');

        // add fonts
        for (const font in this.assets['font']) {
            const fontPath = 'assets/font/' + font + '.woff2';
            const fontFace = new (window as any).FontFace(font, `url(${fontPath})`);
            (document as any).fonts.add(fontFace);

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
        Promise.all([this.splash.show(), (document as any).fonts.ready]).then(() => {
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
        const currentTheme = await this.client.readJSON<any>('assets/theme', name, 'theme.json');
        const defaultTheme = await this.client.readJSON<any>('assets/theme', 'default', 'theme.json');

        // theme stylesheet
        const sheet = <CSSStyleSheet>this.themeNode.sheet;
        
        // get css rules from theme.json (fallback to default any entry not exist)
        let rules = '';
        const addRule = async (entry: string, prop: string, name: string) => {
            // replace relative resource url @(<rel>) with absolute path
            if (prop.indexOf('@(') !== -1) {
                // parts seperated by @(<rel>)
                const parts = prop.split('@(');
                prop = '';

                // replace url
                for (const part of parts) {
                    // skip leading @(
                    if (!part) continue;

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
                    this.audio.resume()
                    
                    if (this.bgmNode.paused && this.db.get('music-volume') > 0) {
                        this.bgmNode.play();
                    }
                    
                    this.node.removeEventListener('pointerup', interact);
                }
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
        const scale = (z: number) => `scale(${Math.ceil(z * 500) / 500})`;

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
    getTransition(type: TransitionDuration = null) {
        let key = 'transition';
        if (type && ['fast', 'slow', 'faster', 'slower'].includes(type)) {
            key += '-' + type;
        }
        const duration = parseFloat(this.css.app[key]) || parseFloat(this.css.app.transition);
        return duration * 1000;
    }

    /** Display alert message. */
    async alert(caption: string, config: ConfirmOptions = {}): Promise<true | null> {
        config.buttons = [['ok', config.ok ?? '确定', 'red']];
        return await this.choose(caption, config) === 'ok' ? true : null;
    }

    /** Display confirm message. */
    async confirm(caption: string, config: ConfirmOptions = {}): Promise<boolean | null> {
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
    choose(caption: string, config: DialogOptions={}): Promise<string | null> {
        const dialog = this.ui.create('dialog');
        dialog.update({caption, content: config.content, buttons: config.buttons});
        const promise = new Promise<string | null>(resolve => {
            dialog.onclose = () => {
                resolve(dialog.result);
            };
            this.popup(dialog, config.id);
        });
        if (config.timeout) {
            return Promise.race([promise, new Promise<null>(resolve => {
                setTimeout(() => resolve(null), config.timeout! * 1000);
            })])
        }
        else {
            return promise;
        }
    }

    /** Displa a popup. */
    popup(dialog: Popup, id?: string) {
        const dialogID = id ?? ++this.dialogCount;
        this.popups.get(dialogID)?.close();
        const onopen = dialog.onopen;
        const onclose = dialog.onclose;

        // other popups that are blurred by dialog.open()
        const blurred: (string | number)[] = [];

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
    removePopup(id: string) {
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