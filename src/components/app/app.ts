import { trigger } from '../../client/client';
import { splash, arena, init } from '../../client/globals';
import { Component, Popup, Peer, Zoom, TransitionDuration } from '../../components';
import { accessExtension, getInfo, createFilter } from '../../extension';
import type { Dict, Select, Selected } from '../../types';

/** Options used by ui.choose(). */
interface DialogOptions {
    buttons?: [string, string, string?][];
    content?: string;
    id?: string;
    timeout?: number;
    temp?: boolean;
}

/** Options used by ui.confirm(). */
interface ConfirmOptions extends DialogOptions {
    ok?: string;
    cancel?: string;
}

export class App extends Component {
    /** Transition durations. */
    #css: Dict<Dict<string>> = {};

    /** Index of assets. */
    #assets!: Dict<Dict<string>>;

    /** Stylesheet for theme. */
    #themeNode = document.createElement('style');

    /** Node for displaying background. */
    #bgNode = this.ui.createElement('background', this.node);

    /** Layer that zooms based on client size. */
    #zoom = this.ui.create('zoom', this.node);

    /** Node for playing background music. */
    #bgmNode = document.createElement('audio');

    /** Background music volume control. */
    #bgmGain!: AudioParam;

    /** Audio context. */
    #audio = new (window.AudioContext || (window as any).webkitAudioContext)();

    /** Popup components cleared when arena close. */
    #popups = new Map<string | number, Popup>();

    /** Count dialog for dialog ID */
    #dialogCount = 0;

    get arena() {
        return arena;
    }

    get width() {
        return this.#currentZoom.width;
    }

    get height() {
        return this.#currentZoom.height;
    }

    get zoom() {
        return this.#currentZoom.zoom;
    }

    get assets() {
        return this.#assets;
    }
    
    get css() {
        return this.#css;
    }

	get popups() {
		return this.#popups;
	}

    get zoomNode() {
        return this.#zoom.node;
    }

    get accessExtension() {
        return accessExtension;
    }

    get getInfo() {
        return getInfo;
    }

    get mode(): string | null {
        return this.arena?.data.mode ?? null;
    }

    get connected() {
        return this.arena?.data.peers ? true : false;
    }

    get #currentZoom(): Zoom {
        return this.arena?.currentZoom ?? this.#zoom;
    }

    async init() {
        const splash = this.ui.create('splash');
        init(this, splash);
        document.head.appendChild(this.#themeNode);
        
        // wait for indexedDB
        await this.db.ready;
        this.loadBackground();
        
        // add bindings for window resize
        await this.ui.ready;
        document.body.appendChild(this.node);
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // load styles and fonts
        this.#initAudio();
        await this.loadTheme();
        await splash.createGallery();
        const initAssets = this.#initAssets();

        // load splash menus
        Promise.all([
            initAssets,
            splash.show(),
            (document as any).fonts.ready
        ]).then(() => splash.createBar());

        // add handler for android back button
        if (this.platform.android) {
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

        // add default styles for box-shadow and text-shadow
        defaultTheme.shadow ??= {};
        defaultTheme.glow ??= {};
        defaultTheme.tshadow ??= {};
        defaultTheme.tglow ??= {};

        const alpha = (c: string, o: number) => c.replace(')', `, ${o})`).replace('rgb(', 'rgba(');

        for (const name in defaultTheme.color) {
            const c = defaultTheme.color[name];
            defaultTheme.shadow[name] ??= `rgba(0, 0, 0, 0.4) 0 0 0 1px, ${alpha(c, 0.5)} 0 0 3px, ${alpha(c, 0.6)} 0 0 6px, ${alpha(c, 0.8)} 0 0 8px`;
            defaultTheme.glow[name] ??= `rgba(0, 0, 0, 0.4) 0 0 0 1px, ${alpha(c, 0.5)} 0 0 5px, ${alpha(c, 0.6)} 0 0 12px, ${alpha(c, 0.8)} 0 0 15px`;
            defaultTheme.tshadow[name] ??= `black 0 0 1px, ${c} 0 0 2px, ${c} 0 0 2px, ${c} 0 0 2px`;
            defaultTheme.tglow[name] ??= `black 0 0 1px, ${c} 0 0 2px, ${c} 0 0 5px, ${c} 0 0 10px, ${c} 0 0 10px, ${c} 0 0 20px, ${c} 0 0 20px`;
        }

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
                if (currentTheme[section]?.hasOwnProperty(entry)) {
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
            icon: 'background-image',
            bcolor: 'background-image',
            fill: 'background',
            color: 'color',
            shadow: 'box-shadow',
            glow: 'box-shadow',
            tshadow: 'text-shadow',
            tglow: 'text-shadow'
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
        if (config.temp) {
            dialog.temp = true;
        }
        dialog.update({caption, content: config.content ?? '', buttons: config.buttons});
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

    /** Display a popup. */
    async popup(dialog: Popup, id?: string) {
        const dialogID = id ?? ++this.#dialogCount;
        this.popups.get(dialogID)?.close();
        const onopen = dialog.onopen;
        const onclose = dialog.onclose;

        // other popups that are blurred by dialog.open()
        const blurred = new Set<string | number>();

        dialog.onopen = () => {
            // blur arena, splash and other popups
            this.node.classList.add('popped');
            for (const [id, popup] of this.popups) {
                if (popup !== dialog && !popup.node.classList.contains('blurred')) {
                    popup.node.classList.add('blurred');
                    blurred.add(id);
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
            blurred.clear();

            if (typeof onclose === 'function') {
                onclose();
            }
        };

        this.popups.set(dialogID, dialog);
        await dialog.ready;
        dialog.open();
    }

    /** Clear alert and confirm dialogs. */
    clearPopups() {
        for (const popup of this.popups.values()) {
            popup.close();
        }
        this.popups.clear();
    }

    /** Bind context menu to hero intro. */
    bindHero(node: HTMLElement, id: string) {
        this.ui.bind(node, {oncontext: e => {
            const info = this.getInfo('hero', id);
            if (!info) {
                return;
            }

            const menu = this.ui.create('popup');
            menu.pane.node.classList.add('intro-wide');
            menu.pane.addCaption(info.name ?? id);
            menu.pane.width = 180;
            menu.location = e;
            
            for (let skill of info.skills ?? []) {
                let pack;
                if (skill.includes(':')) {
                    [pack, skill] = this.utils.split(skill);
                }
                else {
                    pack = this.utils.split(id)[0];
                }
                
                const info = this.accessExtension(pack, 'skill', skill);
                if (info) {
                    menu.pane.addSection(info.name ?? skill);
                    if (info.intro) {
                        menu.pane.addText(info.intro);
                    }
                }
            }

            // open in arena
            menu.arena = true;
            menu.open();
        }});
    }

    /** Bind context menu to card intro. */
    bindCard() {

    }

    /** Bind context menu to player intro. */
    bindPlayer() {

    }

    /** Create filter function for choose task. */
    createFilter(section: string, selected: Selected, sels: Dict<Select>) {
        return createFilter(section, selected, sels, (id: number) => new Proxy(this.getComponent(id)!, {
            get(target, key: string) {
                return target.data[key];
            }
        }));
    }

    /** Adjust zoom level according to device DPI. */
    resize() {
        // actual window size
        const width = window.innerWidth;
        const height = window.innerHeight;

        // ideal window size
        let [ax, ay] = [960, 540];

        // zoom to fit ideal size
        this.#zoom.scale(ax, ay, width, height, this.node);

        // update arena zoom
        if (arena) {
            [ax, ay] = arena.resize(ax, ay, width, height);
            arena.arenaZoom.scale(ax, ay, width, height);
        }

        // trigger resize listeners
        trigger('resize');
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
        this.#assets = await this.utils.readJSON('assets/index.json');

        // add fonts
        for (const font in this.#assets['font']) {
            const fontPath = 'assets/font/' + font + '.woff2';
            const fontFace = new (window as any).FontFace(font, `url(${fontPath})`);
            (document as any).fonts.add(fontFace);

            if (font === this.css.app['caption-font']) {
                fontFace.loaded.then(() => splash.node.classList.add('caption-font-loaded'));
            }
            else if (font === this.css.app['label-font']) {
                fontFace.loaded.then(() => splash.node.classList.add('label-font-loaded'));
            }
        }
    }
}