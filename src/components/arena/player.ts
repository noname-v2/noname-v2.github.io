import { Component } from '../../components';

export class Player extends Component {
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

	/** Nickname of hero's controller. */
	nickname = this.ui.createElement('span', this.content);

    /** Timer bar. */
    timer: HTMLElement | null = null;

    init() {
        this.node.classList.add('hero-hidden');
        this.node.classList.add('vice-hidden');
    }

    $heroImage(name: string | null) {
        if (name) {
            this.node.classList.remove('hero-hidden');
            this.ui.setImage(this.heroImage, name);
        }
        else {
            this.node.classList.add('hero-hidden');
            this.heroImage.style.backgroundImage = '';
        }
    }

    $heroName(name: string | null) {
        this.ui.format(this.heroName, name ?? '');
    }

	$nickname(name?: string) {
		this.ui.format(this.nickname, name ?? '');
	}

    $timer(config?: [number, number]) {
        const removeTimer = () => {
            const timer = this.timer;
            if (timer) {
                this.timer = null;
                this.ui.animate(timer, {opacity: [1, 0]}).onfinish = () => timer.remove();
            }
        };

        if (config) {
            const [timeout, now] = config;
            this.timer?.remove();
            const timer = this.timer = this.ui.createElement('timer', this.content);
            const bar = this.ui.createElement('div', timer);
            this.ui.animate(timer, {opacity: [0, 1]}).onfinish = () => {
                const remaining = timeout - (Date.now() - now) / 1000;
                this.ui.animate(bar, {x: [-100 * (1 - remaining / timeout), -100]}, {
                    duration: remaining * 1000, easing: 'linear'
                }).onfinish = () => {
                    if (timer === this.timer) {
                        removeTimer();
                    }
                };
            };
        }
        else {
            removeTimer();
        }
    }
}