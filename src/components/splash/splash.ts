import { globals } from '../../client/globals';
import { Component } from '../../components';

export class Splash extends Component {
    // gallery of modes
	gallery = this.ui.create('splash-gallery');

	// bottom toolbar
	bar = this.ui.create('splash-bar');

	// settings menu
	settings = this.ui.create('splash-settings');

	// hub menu
	hub = this.ui.create('splash-hub');

	// currently hidden
	hidden = true;
	
	init() {
		// create mode selection gallery
		this.gallery.splash = this;
		this.node.appendChild(this.gallery.node);
		
		// bottom button bar
		this.bar.splash = this;
        this.node.appendChild(this.bar.node);

		// debug mode
		if (globals.client.debug && this.platform.mobile) {
			const script = document.createElement('script');
            script.src = 'lib/eruda/eruda.js';
            script.onload = () => (window as any).eruda.init();
            document.head.appendChild(script);
		}
	}

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
		this.app.node.appendChild(this.node);
		this.gallery.checkPage();
		return new Promise(resolve => {
			this.ui.animate(this.node, {
				scale: ['var(--app-splash-transform)', 1], opacity: [0, 1]
			}).onfinish = resolve;
		});
	}
}