import { globals } from '../../client/globals';
import { Component } from '../../components';
import type { Dict } from '../../types';

export class App extends Component {
	/** App width. */
	width!: number;

	/** App height. */
	height!: number;

    /** Current zoom level. */
	zoom = 1;

    /** Transition durations. */
    css: Dict<Dict<string>> = {};

    /** Index of assets. */
    assets!: Dict<Dict<string>>;

    /** Stylesheet for theme. */
    #themeNode = document.createElement('style');

    /** Node for displaying background. */
    #bgNode = this.ui.createElement('background', this.node);

    /** Node for playing background music. */
    #bgmNode = document.createElement('audio');

    /** Background music volume control. */
    #bgmGain!: AudioParam;

    /** Audio context. */
    #audio = new (window.AudioContext || (window as any).webkitAudioContext)();

    async init() {
        document.head.appendChild(this.#themeNode);
        document.body.appendChild(this.node);

        // add bindings for window resize
        this.#resize();
        window.addEventListener('resize', () => this.#resize());

        // wait for indexedDB
        await this.db.ready;
        this.loadBackground();
        this.#initAudio();

        // load styles and fonts
        await this.loadTheme();
        const splash = globals.splash = this.ui.create('splash');
        await splash.gallery.ready;
        const initAssets = this.#initAssets();

        // load splash menus
        Promise.all([initAssets, splash.show(), (document as any).fonts.ready]).then(() => {
            splash.hub.create(splash);
            splash.settings.create(splash);
        });

        // add handler for android back button
        if (this.client.android) {
            window.addEventListener('popstate', e => {
                const arena = this.arena;
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
        const currentTheme = await this.utils.readJSON<any>('assets/theme', name, 'theme.json');
        const defaultTheme = await this.utils.readJSON<any>('assets/theme', 'default', 'theme.json');

        // theme stylesheet
        const sheet = this.#themeNode.sheet!;
        
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
        const dataset: Dict = {
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
    loadBackground() {
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
                    this.#audio.resume()
                    
                    if (this.#bgmNode.paused && this.db.get('music-volume') > 0) {
                        this.#bgmNode.play();
                    }
                    
                    this.node.removeEventListener('pointerup', interact);
                }
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
    switchMusic(bgm: string) {
        this.#bgmNode.src = `assets/bgm/${bgm}.mp3`;
        this.#bgmNode.play();
    }

    /** Change background music volume. */
    changeVolume(vol: number) {
        this.#bgmGain.value = vol / 100;
        if (vol && this.#bgmNode.paused) {
            setTimeout(() => this.playMusic());
        }
        else if (vol == 0) {
            this.#bgmNode.pause();
        }
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
        this.assets = await this.utils.readJSON('assets/index.json');

        // add fonts
        for (const font in this.assets['font']) {
            const fontPath = 'assets/font/' + font + '.woff2';
            const fontFace = new (window as any).FontFace(font, `url(${fontPath})`);
            (document as any).fonts.add(fontFace);

            if (font === this.css.app['caption-font']) {
                fontFace.loaded.then(() => globals.splash.node.classList.add('caption-font-loaded'));
            }
            else if (font === this.css.app['label-font']) {
                fontFace.loaded.then(() => globals.splash.node.classList.add('label-font-loaded'));
            }
        }
    }

    /** Adjust zoom level according to device DPI. */
    #resize() {
        // actual window size
        const width = window.innerWidth;
        const height = window.innerHeight;

        // ideal window size
        let [ax, ay] = [960, 540];

        // let current mode determine ideal size
        if (globals.arena) {
            [ax, ay] = globals.arena.resize(ax, ay, width, height);
        }

        // zoom to fit ideal size
        const zx = width / ax, zy = height / ay;

        if (zx < zy) {
            this.width = ax;
            this.height = ax / width * height;
            this.zoom = zx;
        }
        else {
            this.width = ay / height * width;
            this.height = ay;
            this.zoom = zy;
        }

        // update styles
        globals.app.node.style.setProperty('--app-width', this.width + 'px');
        globals.app.node.style.setProperty('--app-height', this.height + 'px');
        globals.app.node.style.setProperty('--app-scale', this.zoom.toString());

        // trigger resize listeners
        globals.client.trigger('resize');
    }
}