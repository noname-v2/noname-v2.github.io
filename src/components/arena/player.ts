import { Component, Timer } from '../../components';

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
    timer: Timer | null = null;

    $heroImage(name: string | null) {
        if (name) {
            this.node.classList.add('hero-shown');
            this.ui.setImage(this.heroImage, name);
        }
        else {
            this.node.classList.remove('hero-shown');
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
        if (config) {
            const timer = this.ui.create('timer', this.content);
            timer.start(config, this);
        }
        else {
            this.timer?.remove();
        }
    }

    $owner() {
        if (this.mine) {
            this.node.classList.add('mine');
        }
        else {
            this.node.classList.remove('mine');
        }
    }
}