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
        this.heroName.innerHTML = name ?? '';
    }
}