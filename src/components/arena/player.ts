import { Component } from '../../components';

export class Player extends Component {
    /** Player background. */
    background = this.ui.createElement('background', this.node);

    /** Main hero image. */
    heroImage = this.ui.createElement('image', this.background);

    /** Vice hero image. */
    viceImage = this.ui.createElement('image.vice', this.background);

	/** Main hero name. */
	heroName = this.ui.createElement('caption', this.node);
    
	/** Vice hero name. */
	viceName = this.ui.createElement('caption', this.node);

    init() {
        this.node.classList.add('hero-hidden');
        this.node.classList.add('vice-hidden');
    }

    $hero(name: string | null) {
        if (name) {
            this.node.classList.remove('hero-hidden');
            this.ui.setImage(this.heroImage, name);
        }
        else {
            this.node.classList.add('hero-hidden');
            this.heroImage.style.backgroundImage = '';
        }
    }
}