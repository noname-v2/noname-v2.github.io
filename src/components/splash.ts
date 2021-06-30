import { Component, Popup, Gallery } from '../components';

interface ExtensionIndex {
	[key: string]: {
		mode: string;
		pack: boolean;
		tags: string[];
	}
}

export class Splash extends Component {
    // gallery of modes
	gallery = <Gallery>this.ui.create('gallery');

	// bottom toolbar
	bar = this.ui.createElement('bar');

	// settings menu
	settings = <Popup>this.ui.create('popup');

	// hub menu
	hub = <Popup>this.ui.create('popup');

	private createModeEntry(mode: string, extensions: ExtensionIndex) {
        const ui = this.ui;
		const entry = ui.createElement('widget');
		const name = extensions[mode]['mode'];
		
		// set mode backgrround
		const bg = ui.createElement('image', entry);
		ui.setBackground(bg, 'extensions', mode, 'mode.webp');
		
		// set caption
		const caption = ui.createElement('caption', entry);
		caption.innerHTML = name;

		// bind click
		ui.bindClick(entry, () => {
			const packs = [];

			for (const name in extensions) {
				let add = true;

				if (extensions[mode]['tags']) {
					for (const tag of extensions[mode]['tags']) {
						if (tag[tag.length-1] === '!') {
							if (!extensions[name]['tags'] || !extensions[name]['tags'].includes(tag)) {
								add = false;
								break;
							}
						}
					}
				}
				
				if (add && extensions[name]['tags']) {
					for (const tag of extensions[name]['tags']) {
						if (tag[tag.length-1] === '!') {
							if (!extensions[mode]['tags'] || !extensions[mode]['tags'].includes(tag)) {
								add = false;
								break;
							}
						}
					}
				}
				
				if (add && extensions[name].pack) {
					packs.push(name);
				}
			}

			this.client.connect([mode, packs]);
			this.hide();
		});

		return entry
	}

	private async createGallery() {
		const extensions = await this.client.readJSON<ExtensionIndex>('extensions/index.json');
		const modeNames = <{[key: string]: string}>{};
		const modes = <string[]>[];

		for (const name in extensions) {
			if (extensions[name]['mode']) {
				modeNames[name] = extensions[name]['mode'];
				modes.push(name);
			}
		}
		
		this.gallery.setup(1, 5, 900, true);

		for (let i = 0; i < modes.length; i += 5) {
			this.gallery.addPage(add => {
				for (let j = 0; j < 5; j++) {
					const mode = modes[i + j];
					if (mode) {
						add(this.createModeEntry(mode, extensions));
					}
				}
			});
		}
	}

    private createButton(caption: string, color: string, onclick: () => void) {
        const button = this.ui.create('button');
        button.update({ caption, color });
        this.ui.bindClick(button.node, onclick);
        this.bar.appendChild(button.node);
    }

	createHub() {
		const hub = this.hub;
	}

	createSettings() {
		// setup dialog
		const settings = this.settings;
		settings.temp = true;
		settings.pane.node.classList.add('settings');

		const rotating: [HTMLElement | null, Animation | null] = [null, null];

		const rotate = (node: HTMLElement) => {
			if (rotating && rotating[0] !== node) {
				rotating[1]?.pause();
			}

			const animation = rotating[0] === node ? rotating[1] : node.getAnimations()[0];
			rotating[0] = node;

			if (animation) {
				rotating[1] = animation;
				animation.play();
			}
			else {
				rotating[1] = node.animate([
					{transform: 'rotate(0deg)'}, {transform: 'rotate(360deg)'}
				], {
					duration: 10000,
					iterations: Infinity
				});
			}
		}

		settings.onopen = () => {
			this.node.classList.add('blurred');
			if (rotating[0]) {
				rotate(rotating[0]);
			}
		};
		settings.onclose = () => {
			this.node.classList.remove('blurred');

			if (rotating[0]) {
				rotating[1]?.pause();
			}
		};

		// add content
		const pane = settings.pane;

		pane.addSection('主题');

		const themes = Array.from(Object.keys(this.app.assets.theme));
		const themeGallery = pane.addGallery(1, 3, 410);

		for (let i = 0; i <= themes.length; i += 3) {
			themeGallery.addPage(add => {
				for (let j = 0; j < 3; j++) {
					const theme = themes[i + j];
					if (theme) {
						const node = this.ui.createElement('widget.sharp');
						this.ui.setBackground(this.ui.createElement('image', node), `assets/theme/${theme}/theme.webp`);

						if (theme === this.db.get('theme')) {
							node.classList.add('active')
						}

						this.ui.bindClick(node, () => {
							if (theme !== this.db.get('theme')) {
								node.parentNode?.parentNode?.parentNode?.parentNode?.querySelector('noname-widget.active')?.classList.remove('active');
								node.classList.add('active');
								this.db.set('theme', theme);
								this.app.loadTheme();
							}
						});

						add(node);
					}
					else if (i + j === themes.length) {
						const node = this.ui.createElement('widget.sharp');
						const content = this.ui.createElement('content', node);
						this.ui.createElement('caption', content).innerHTML = '⊕ 创建主题';

						add(node);
					}
				}
			});
		}

		pane.addSection('背景');

		const bgs = Array.from(Object.keys(this.app.assets.bg));
		const bgGallery = pane.addGallery(1, 3, 410);

		for (let i = 0; i <= bgs.length; i += 3) {
			bgGallery.addPage(add => {
				for (let j = 0; j < 3; j++) {
					const bg = bgs[i + j];
					if (bg) {
						const node = this.ui.createElement('widget.sharp');
						this.ui.setBackground(this.ui.createElement('image', node), `assets/bg/${bg}.webp`);

						if (bg === this.db.get('bg')) {
							node.classList.add('active')
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

						add(node);
					}
					else if (i + j === bgs.length) {
						const node = this.ui.createElement('widget.sharp');
						const content = this.ui.createElement('content', node);
						this.ui.createElement('caption', content).innerHTML = '⊕ 添加背景';

						add(node);
					}
				}
			});
		}

		pane.addSection('音乐');

		const volGallery = pane.addGallery(1, 2, 410);
		volGallery.node.classList.add('volume');

		const createSlider = (caption: string, key: string) => {
			const node = this.ui.createElement('widget.sharp');
			const img = this.ui.createElement('image', node);
			const slider = this.ui.createElement('slider', img);
			this.ui.createElement('div', slider);
			this.ui.createElement('div', slider);
			const content = this.ui.createElement('content', node);
			const text = this.ui.createElement('text', content);
			text.innerHTML = caption + '<div>' + this.db.get(key) + '</div>';

			const updatetVolume = (vol: number) => {
				let offset = -(100 - vol) / 100 * width;
				if (vol === 0) {
					offset -= 1
				}
				this.ui.dispatchMove(slider, {x: offset ?? -width, y: 0})
			};

			const width = 180 - 2 * parseFloat(this.app.css.widget['image-margin-sharp']);

			this.ui.bindMove(slider, {
				movable: {x: [-width-1, 0], y: [0,0]},
				onmove: ({x}) => {
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
			}, {passive: true});
			
			updatetVolume(this.db.get(key));

			return node;
		}

		volGallery.addPage(add => {
			add(createSlider('音乐音量：', 'music-volume'));
			add(createSlider('音效音量：', 'audio-volume'));
		});

		const bgms = Array.from(Object.keys(this.app.assets.bgm));
		const bgmGallery = pane.addGallery(1, 6, 410);
		bgmGallery.node.classList.add('music');

		for (let i = 0; i <= bgms.length; i += 6) {
			bgmGallery.addPage(add => {
				for (let j = 0; j < 6; j++) {
					const bgm = bgms[i + j];
					if (bgm) {
						const node = this.ui.createElement('widget.sharp');
						this.ui.setBackground(this.ui.createElement('image', node), `assets/bgm/${bgm}.webp`);

						if (bgm === this.db.get('splash-music')) {
							rotating[0] = node;
						}

						if (bgm === this.db.get('game-music')) {
							node.classList.add('active');
						}

						const setSplash = () => {
							rotate(node);
							this.db.set('splash-music', bgm);
						};

						const unsetSplash = () => {
							if (rotating[0] === node) {
								rotating[1]?.pause();
								rotating[0] = null;
								rotating[1] = null;
							}
							if (this.db.get('splash-music') === bgm) {								
								this.db.set('splash-music', 'none');
							}
						};

						const setGame = () => {
							node.parentNode?.parentNode?.parentNode?.parentNode?.querySelector('noname-widget.active')?.classList.remove('active');
							node.classList.add('active');
							this.db.set('game-music', bgm);
						};

						const unsetGame = () => {
							node.classList.remove('active');
							if (this.db.get('game-music') === bgm) {								
								this.db.set('game-music', 'none');
							}
						};

						this.ui.bindClick(node, e => {
							const rotating_bak: [HTMLElement | null, Animation | null] = [rotating[0], rotating[1]];
							this.app.bgmNode.src = `assets/bgm/${bgm}.mp3`;
							this.app.bgmNode.play();
							const menu = <Popup>this.ui.create('popup');
							menu.temp = true;
							menu.transition = 'fast';
							rotate(node);
							const restore = () => {
								if (rotating_bak[0] && rotating_bak[0] !== node) {
									rotating[0] = rotating_bak[0];
									rotating[1] = rotating_bak[1];
									rotating[1] ? rotating[1].play() : rotate(rotating[0]);
								}
								this.app.playMusic();
							}
							const cleanUp = () => {
								menu.onclose = null;
								menu.close();
							};
							menu.pane.addOption('等待音乐', () => {
								setSplash();
								unsetGame();
								cleanUp();
							});
							menu.pane.addOption('游戏音乐', () => {
								setGame();
								unsetSplash();
								restore();
								cleanUp();
							});
							menu.pane.addOption('全部应用', () => {
								setSplash();
								setGame();
								cleanUp();
							});
							menu.onclose = () => {
								unsetSplash();
								unsetGame();
								restore();
							};
							menu.open(e);
						});

						add(node);
					}
					else if (i + j === bgms.length) {
						const node = this.ui.createElement('widget.sharp');
						const content = this.ui.createElement('content.plus', node);
						this.ui.createElement('caption', content).innerHTML = '+';

						add(node);
					}
				}
			});
		}
	}
	
	init() {
		// create mode selection gallery
		this.createGallery();

		// reset game in debug mode
		if (this.client.debug) {
			this.createButton('重置', 'red', async () => {
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
			});	
		}

		// create buttom buttons
        this.createButton('工坊', 'yellow', () => {
            console.log('yellow');
        });

        this.createButton('联机', 'green', () => {
            console.log('green');
        });

        this.createButton('选项', 'orange', () => {
            this.settings.open();
        });

		this.node.appendChild(this.gallery.node);
        this.node.appendChild(this.bar);
	}

	hide() {
		this.ui.animate(this.node, {
			scale: [1, 'var(--app-splash-transform)'], opacity: [1, 0]
		}).onfinish = () => {
			this.node.remove();
		}
	}

	show() {
		this.app.node.appendChild(this.node);
		this.ui.animate(this.node, {
			scale: ['var(--app-splash-transform)', 1], opacity: [0, 1]
		});
	}
}