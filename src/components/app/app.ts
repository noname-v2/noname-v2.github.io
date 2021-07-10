import { Component, Arena, Splash, TransitionDuration } from '../../components';

export class App extends Component {
	/** Arena component. */
	arena: Arena | null = null;

	/** Splash component. */
	splash!: Splash;

	/** Transition durations. */
	css: {[key: string]: {[key: string]: string}} = {};

	/** Index of assets. */
	assets!: {[key: string]: {[key: string]: string}};

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

    init() {
		document.head.appendChild(this.themeNode);
		
		// setup triggers
		this.resize();
		window.addEventListener('resize', this.resize.bind(this));
		this.node.addEventListener('wheel', e => e.preventDefault(), {passive: false}); // prevent two finger swipe gesture in safari
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
		const fonts = (document as any).fonts;
		
		for (const font in this.assets['font']) {
			const fontPath = 'assets/font/' + font + '.woff2';
			const fontFace = new (window as any).FontFace(font, `url(${fontPath})`);
			fonts.add(fontFace);
		}

		await (document as any).fonts.ready;
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
	getTransition(type: TransitionDuration = null) {
		let key = 'transition';
		if (type && ['fast', 'slow', 'faster', 'slower'].includes(type)) {
			key += '-' + type;
		}
		const duration = parseFloat(this.css.app[key]) || parseFloat(this.css.app.transition);
		return duration * 1000;
	}

	/** Display alert message. */
	alert(caption: string, content='', confirm='确定') {
		const cmp = this.ui.create('alert');
		// const layer = this.ui.createElement('alert', this.node);
		// this.ui.createElement('caption', layer).innerHTML = msg;
		// this.ui.createElement('button', layer).innerHTML = '退出';
	}

	/** Display confirm message. */
	confirm(caption: string, content='', confirm='确定') {
		const cmp = this.ui.create('alert');
		// const layer = this.ui.createElement('alert', this.node);
		// this.ui.createElement('caption', layer).innerHTML = msg;
		// this.ui.createElement('button', layer).innerHTML = '退出';
	}
}