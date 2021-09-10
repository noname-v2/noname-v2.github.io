import { Popup } from '../popup';
import { splash } from '../../client/globals';
import { Point, Gallery } from '../../components';

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
    init() {
        super.init();
        
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
        this.#addGallery('theme', '主题',  '⊕ 添加背景', () => this.#addTheme());
        this.#addGallery('bg', '背景', '⊕ 添加背景', () => this.#addBackground());
        this.#addGallery('bgm', '音乐', '+', () => this.#addMusic());

		// enable button click after creation finish
		splash.bar.buttons.get('settings')!.node.classList.remove('disabled');
    }

    #addGallery(section: string, caption: string, add: string, onadd: () => void) {
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
            this.ui.bind(node, onadd);
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

        this.ui.bind(slider, {
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

    /** Add a gallery item. */
    #addItem(item: string, section: string) {
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
            this.ui.bind(node, e => this.#musicMenu(node, item, e));
        }
        else {
            this.ui.bind(node, () => this.#clickItem(node, item, section));
        }

        return node;
    }

    /** Callback when clicking theme or background entry. */
    #clickItem(node: HTMLElement, item: string, section: string) {
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
    #musicMenu(node: HTMLElement, bgm: string, e: Point) {
        const rotating_bak: [HTMLElement | null, Animation | null] = [this.#rotating, this.#rotatingAnimation];
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
        }
        
        // callback for clicking on menu entry
        const clickOption = (splash: boolean, game: boolean) => {
            this.#rotateMusic(node, bgm, splash, game);
            menu.onclose = null;
            menu.close();
        }
        menu.pane.addOption('等待音乐', () => clickOption(true, false));
        menu.pane.addOption('游戏音乐', () => {clickOption(false, true); restore()});
        menu.pane.addOption('全部应用', () => clickOption(true, true));
        menu.onclose = () => {this.#rotateMusic(node, bgm, false, false); restore()};
        menu.open(e);
    }

    /** Create rotation animation for music selector. */
    #rotate(node: HTMLElement) {
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
                {transform: 'rotate(0deg)'}, {transform: 'rotate(360deg)'}
            ], {
                duration: 10000,
                iterations: Infinity
            });
        }
    }

    /** Rotate / highlight music gallery item. */
    #rotateMusic(node: HTMLElement, bgm: string, splash: boolean, game: boolean) {
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

    #addTheme() {}
    #addBackground() {}
    #addMusic() {}
}