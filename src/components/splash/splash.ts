import { Component, SplashGallery, SplashSettings, SplashHub } from '../../components/component';

export class Splash extends Component {
    // gallery of modes
	gallery!: SplashGallery;

	// bottom toolbar
	bar = this.ui.create('splashBar');

	// settings menu
	settings!: SplashSettings;

	// hub menu
	hub!: SplashHub;

	// currently hidden
	hidden = true;

	createGallery() {
		this.gallery = this.ui.create('splashGallery');
		return this.gallery.ready;
	}

	createBar() {
		this.settings = this.ui.create('splashSettings');
		this.hub = this.ui.create('splashHub');
	}

	hide(faded: boolean = false) {
		if (this.hidden) {
			return;
		}
		this.hidden = true;
		this.ui.animate(this.node, {
			scale: [faded ? 'var(--app-zoom-scale)' : 1, 'var(--app-zoom-scale)'],
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
				scale: ['var(--app-zoom-scale)', 1], opacity: [0, 1]
			}).onfinish = resolve;
		});
	}
}