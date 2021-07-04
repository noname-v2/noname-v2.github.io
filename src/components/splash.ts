import { Component, SplashHub, SplashSettings, Gallery, SplashBar } from '../components';

interface ExtensionIndex {
	[key: string]: {
		mode: string;
		pack: boolean;
		tags: string[];
	}
}

export class Splash extends Component {
    // gallery of modes
	gallery = <Gallery>this.ui.create('gallery');

	// bottom toolbar
	bar = <SplashBar>this.ui.create('splash-bar');

	// settings menu
	settings = <SplashSettings>this.ui.create('splash-settings');

	// hub menu
	hub = <SplashHub>this.ui.create('splash-hub');

	private createModeEntry(mode: string, extensions: ExtensionIndex) {
        const ui = this.ui;
		const entry = ui.createElement('widget');
		const name = extensions[mode]['mode'];
		
		// set mode backgrround
		const bg = ui.createElement('image', entry);
		ui.setBackground(bg, 'extensions', mode, 'mode');
		
		// set caption
		const caption = ui.createElement('caption', entry);
		caption.innerHTML = name;

		// bind click
		ui.bindClick(entry, () => {
			const packs = [];

			for (const name in extensions) {
				let add = true;

				if (extensions[mode]['tags']) {
					for (const tag of extensions[mode]['tags']) {
						if (tag[tag.length-1] === '!') {
							if (!extensions[name]['tags'] || !extensions[name]['tags'].includes(tag)) {
								add = false;
								break;
							}
						}
					}
				}
				
				if (add && extensions[name]['tags']) {
					for (const tag of extensions[name]['tags']) {
						if (tag[tag.length-1] === '!') {
							if (!extensions[mode]['tags'] || !extensions[mode]['tags'].includes(tag)) {
								add = false;
								break;
							}
						}
					}
				}
				
				if (add && extensions[name].pack) {
					packs.push(name);
				}
			}

			this.client.connect([mode, packs]);
			this.hide();
		});

		return entry
	}

	private async createGallery() {
		const extensions = await this.client.readJSON<ExtensionIndex>('extensions/index.json');
		const modeNames = <{[key: string]: string}>{};
		const modes = <string[]>[];

		for (const name in extensions) {
			if (extensions[name]['mode']) {
				modeNames[name] = extensions[name]['mode'];
				modes.push(name);
			}
		}
		
		this.gallery.nrows = 1;
		this.gallery.ncols = 5;
		this.gallery.width = 900;
		this.gallery.overflow = true;

		for (let i = 0; i < modes.length; i += 5) {
			this.gallery.addPage(add => {
				for (let j = 0; j < 5; j++) {
					const mode = modes[i + j];
					if (mode) {
						add(this.createModeEntry(mode, extensions));
					}
				}
			});
		}
	}
	
	init() {
		// create mode selection gallery
		this.createGallery();
		this.node.appendChild(this.gallery.node);
		
		// bottom button bar
		this.bar.splash = this;
        this.node.appendChild(this.bar.node);
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