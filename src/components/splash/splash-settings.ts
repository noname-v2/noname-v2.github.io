import { Popup } from '../popup';
import { Splash, Point, Gallery } from '../../components';

export class SplashSettings extends Popup {
    /** Portrait sized popup. */
    size = 'portrait' as const;

    /** Gallery column number. */
    ncols = 3;

    /** All galleries. */
    galleries = new Set<Gallery>();

    /** Currently rotating music nodes. */
	#rotating: HTMLElement | null = null;

    /** Animation of this.rotating. */
    #rotatingAnimation: Animation | null = null;

    /** Called by app after UI loaded. */
    create(splash: Splash) {
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
        this.#addThemes();
        this.#addBackgrounds();
        this.#addMusic();

		// enable button click after creation finish
		splash.bar.buttons.get('settings')!.node.classList.remove('disabled');
    }

    // #addGalery(section: string, caption: string) {
    //     this.pane.addSection(caption);
    //     const items = Array.from(Object.keys(this.app.assets[section]));
    //     const gallery = this.pane.addGallery(1, this.ncols);

    //     for (const item of items) {
    //         gallery.add(() => {
    //             const node = this.ui.createElement('widget.sharp');
    //             const src = `assets/theme/${item}` + (item === 'theme' ? '/theme' : '');
    //             this.ui.setBackground(this.ui.createElement('image', node), src);
    //         });
    //     }
    // }

    #addThemes() {
        this.pane.addSection('主题');

		const themes = Array.from(Object.keys(this.app.assets.theme));
		const themeGallery = this.pane.addGallery(1, this.ncols);
        this.galleries.add(themeGallery);

        for (const theme of themes) {
            themeGallery.add(() => {
                const node = this.ui.createElement('widget.sharp');
                this.ui.setBackground(this.ui.createElement('image', node), `assets/theme/${theme}/theme`);

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

    #addBackgrounds() {
        this.pane.addSection('背景');

		const bgs = Array.from(Object.keys(this.app.assets.bg));
		const bgGallery = this.pane.addGallery(1, this.ncols);
        this.galleries.add(bgGallery);

        for (const bg of bgs) {
            bgGallery.add(() => {
                const node = this.ui.createElement('widget.sharp');
                this.ui.setBackground(this.ui.createElement('image', node), 'assets/bg/', bg);

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

    #addMusic() {
        this.pane.addSection('音乐');

		const volGallery = this.pane.addGallery(1, 2);
		volGallery.node.classList.add('volume');
        volGallery.add(this.#createSlider('音乐音量：', 'music-volume'));
        volGallery.add(this.#createSlider('音效音量：', 'audio-volume'));
        this.galleries.add(volGallery);

		const bgms = Array.from(Object.keys(this.app.assets.bgm));
		const bgmGallery = this.pane.addGallery(1, this.ncols * 2);
		bgmGallery.node.classList.add('music');
        this.galleries.add(bgmGallery);

        for (const bgm of bgms) {
            bgmGallery.add(() => {
                const node = this.ui.createElement('widget.sharp');
                this.ui.setBackground(this.ui.createElement('image', node), 'assets/bgm', bgm);

                if (bgm === this.db.get('bgm-splash')) {
                    this.#rotating = node;
                }

                if (bgm === this.db.get('bgm')) {
                    node.classList.add('active');
                }

                this.ui.bindClick(node, e => this.#musicMenu(node, bgm, e));

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

    #createSlider(caption: string, key: string) {
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
        }, {passive: true});
        
        updatetVolume(this.db.get(key));

        return node;
    }

    #musicMenu(node: HTMLElement, bgm: string, e: Point) {
        const rotating_bak: [HTMLElement | null, Animation | null] = [this.#rotating, this.#rotatingAnimation];
        this.app.switchMusic(bgm);
        const menu = this.ui.create('popup');
        this.#rotate(node);

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
        }
        
        menu.pane.addOption('等待音乐', () => {
            this.#rotateMusic(node, bgm, true, false);
            menu.onclose = null;
            menu.close();
        });
        menu.pane.addOption('游戏音乐', () => {
            this.#rotateMusic(node, bgm, false, true);
            restore();
            menu.onclose = null;
            menu.close();
        });
        menu.pane.addOption('全部应用', () => {
            this.#rotateMusic(node, bgm, true, true);
            menu.onclose = null;
            menu.close();
        });
        menu.onclose = () => {
            this.#rotateMusic(node, bgm, false, false);
            restore();
        };
        menu.location = e;
        menu.open();
    }

    /** Create rotation animation for music selector. */
    #rotate(node: HTMLElement) {
        if (this.#rotating !== node) {
            this.#rotatingAnimation?.pause();
        }

        const animation = this.#rotating === node ? this.#rotatingAnimation : node.getAnimations()[0];
        this.#rotating = node;

        if (animation) {
            this.#rotatingAnimation = animation;
            animation.play();
        }
        else {
            this.#rotatingAnimation = node.animate([
                {transform: 'rotate(0deg)'}, {transform: 'rotate(360deg)'}
            ], {
                duration: 10000,
                iterations: Infinity
            });
        }
    }

    #rotateMusic(node: HTMLElement, bgm: string, splash: boolean, game: boolean) {
        if (splash) {
            this.#rotate(node);
            this.db.set('bgm-splash', bgm);
        }
        else {
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
            node.parentNode?.parentNode?.parentNode?.parentNode?.querySelector('noname-widget.active')?.classList.remove('active');
            node.classList.add('active');
            this.db.set('bgm', bgm);
        }
        else {
            node.classList.remove('active');
            if (this.db.get('bgm') === bgm) {								
                this.db.set('bgm', 'none');
            }
        }
    }
}