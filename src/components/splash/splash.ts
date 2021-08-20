import { debug } from '../../client/client';
import { Component, SplashGallery } from '../../components';

export class Splash extends Component {
    // gallery of modes
	gallery!: SplashGallery;

	// bottom toolbar
	bar = this.ui.create('splash-bar');

	// settings menu
	settings = this.ui.create('splash-settings');

	// hub menu
	hub = this.ui.create('splash-hub');

	// currently hidden
	hidden = true;

	hide(faded: boolean = false) {
		if (this.hidden) {
			return;
		}
		this.hidden = true;
		this.ui.animate(this.node, {
			scale: [faded ? 'var(--app-splash-transform)' : 1, 'var(--app-splash-transform)'],
			opacity: [faded ? 'var(--app-blurred-opacity)' : 1, 0]
		}).onfinish = () => {
			this.node.remove();
		}
	}

	show() {
		if (!this.hidden) {
			return;
		}
		this.hidden = false;
		this.app.zoomNode.appendChild(this.node);
		this.gallery.checkPage();
		return new Promise(resolve => {
			this.ui.animate(this.node, {
				scale: ['var(--app-splash-transform)', 1], opacity: [0, 1]
			}).onfinish = resolve;
		});
	}
}