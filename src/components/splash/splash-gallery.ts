import { Gallery } from '../gallery';
import { Splash } from '../../components';
import type { Extension } from '../../worker/extension';

interface ExtensionMeta {
	mode: string;
	pack: boolean;
	tags: string[];
}

interface ExtensionIndex {
	[key: string]: ExtensionMeta
}

export class SplashGallery extends Gallery {
    /** Use tag <noname-gallery>. */
    static tag = 'gallery';

    /** Reference to Splash. */
    splash!: Splash;

    /** Gallery has no boundary. */
    overflow = true;

    /** Single row. */
    nrows = 1;

    /** 5 Columns in a page. */
    ncols = 5;

    /** Default window width. */
    width = 900;

	/** Extension index. */
	index: ExtensionIndex = {};

    async init() {
        super.init();

		this.index = await this.db.readFile('extensions/index.json') || {};
		const extensions = await this.client.readJSON<string[]>('extensions/extensions.json');
		const modeNames = <{[key: string]: string}>{};
		const modes = <string[]>[];

		// udpate index.json
		let write = false;

		for (const name of extensions) {
			if (!this.index[name]) {
				await this.loadExtension(name);
				if (this.index[name]) {
					write = true;
				}
			}
			if (this.index[name]?.mode) {
				modeNames[name] = this.index[name].mode;
				modes.push(name);
			}
		}

		if (write) {
			await this.db.writeFile('extensions/index.json', this.index);
		}

		for (let i = 0; i < modes.length; i += 5) {
			this.addPage(add => {
				for (let j = 0; j < 5; j++) {
					const mode = modes[i + j];
					if (mode) {
						add(this.addMode(mode, this.index));
					}
				}
			});
		}
    }

	async loadExtension(name: string) {
		if (!this.index[name]) {
			try {
				const idx = <ExtensionMeta>{};
				const ext = <Extension>(await import(`../extensions/${name}/main.js`)).default;
				if (ext.heropack || ext.cardpack) {
					idx.pack = true;
				}
				if (ext.mode?.name) {
					idx.mode = ext.mode.name
				}
				if (ext.tags) {
					idx.tags = ext.tags;
				}
				this.index[name] = idx;
			}
			catch {
				console.log(name);
			}
		}
	}

    addMode(mode: string, extensions: ExtensionIndex) {
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
			this.splash.hide();
		});

		return entry
	}
}