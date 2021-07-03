import { Component, PopupHub, PopupSettings, Gallery, Button } from '../components';

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
	bar = this.ui.createElement('bar');

	// bottom toolbar buttons
	buttons = <{[key: string]: Button}>{};

	// settings menu
	settings = <PopupSettings>this.ui.create('popup-settings');

	// hub menu
	hub = <PopupHub>this.ui.create('popup-hub');

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
		
		this.gallery.setup(1, 5, 900, true);

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

    private createButton(caption: string, color: string, onclick: () => void) {
        const button = <Button>this.ui.create('button');
        button.update({ caption, color });
		button.node.classList.add('disabled');
        this.ui.bindClick(button.node, onclick);
        this.bar.appendChild(button.node);
		return button;
    }
	
	init() {
		// create mode selection gallery
		this.createGallery();

		// reset game in debug mode
		if (this.client.debug) {
			this.createButton('重置', 'red', async () => {
				this.app.node.style.opacity = '0.5';
				
				if (window['caches']) {
					await window['caches'].delete(this.client.version);
				}

				for (const file of await this.db.readdir()) {
					if (file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.css')) {
						await this.db.writeFile(file, null);
					}
				}

				window.location.reload();
			}).node.classList.remove('disabled');
		}

		// create buttom buttons
        this.buttons.workshop = this.createButton('工坊', 'yellow', () => {
            console.log('yellow');
        });

        this.buttons.hub = this.createButton('联机', 'green', () => {
            this.hub.open();
        });

        this.buttons.settings = this.createButton('选项', 'orange', () => {
            this.settings.open();
        });

		this.node.appendChild(this.gallery.node);
        this.node.appendChild(this.bar);
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