import { Component, SplashHub, SplashSettings, SplashGallery, SplashBar } from '../../components';


export class Splash extends Component {
    // gallery of modes
	gallery = <SplashGallery>this.ui.create('splash-gallery');

	// bottom toolbar
	bar = <SplashBar>this.ui.create('splash-bar');

	// settings menu
	settings = <SplashSettings>this.ui.create('splash-settings');

	// hub menu
	hub = <SplashHub>this.ui.create('splash-hub');
	
	init() {
		// create mode selection gallery
		this.gallery.splash = this;
		this.node.appendChild(this.gallery.node);
		
		// bottom button bar
		this.bar.splash = this;
        this.node.appendChild(this.bar.node);

		// debug mode
		if (this.client.debug && ['iOS', 'Android'].includes(this.client.platform)) {
			const script = document.createElement('script');
            script.src = 'lib/eruda/eruda.js';
            script.onload = () => (window as any).eruda.init();
            document.head.appendChild(script);
		}
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