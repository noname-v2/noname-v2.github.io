import { Gallery } from '../gallery';
import { Splash } from '../../components';
import type { Extension } from '../../worker/extension';
import type { Dict } from '../../utils';

interface ExtensionMeta {
	mode: string;
	pack: boolean;
	tags: string[];
	images: string[];
}

interface ExtensionIndex {
	[key: string]: ExtensionMeta
}

export class SplashGallery extends Gallery {
    /** Reference to Splash. */
    splash!: Splash;

    /** Single row. */
    nrows = 1;

	/** Extension index. */
	index!: ExtensionIndex;

    async init() {
		// determine gallery column number
		const margin = parseInt(this.app.css.app['splash-margin']);
		this.ncols = [1, margin * 2, margin, parseInt(this.app.css.player.width)];
        super.init();

		// get modes
		this.index = await this.db.readFile('extensions/index.json') || {};
		const extensions = await this.client.utils.readJSON<string[]>('extensions/extensions.json');
		const modeNames: Dict<string> ={};
		const modes: string[] = [];

		// udpate extension index
		let write = false;
		await Promise.all(extensions.map(async name => {
			if (!this.index[name]) {
				await this.loadExtension(name);
				if (this.index[name]) {
					write = true;
				}
			}
		}));
		if (write) {
			await this.db.writeFile('extensions/index.json', this.index);
		}

		// add mode entries
		for (const name of extensions) {
			if (this.index[name]?.mode) {
				modeNames[name] = this.index[name].mode;
				modes.push(name);
			}
		}
		for (const name of modes) {
			this.add(() => this.addMode(name));
		}
    }

	async loadExtension(name: string) {
		if (!this.index[name]) {
			try {
				const idx = {} as ExtensionMeta;
				const ext = (await import(`../extensions/${name}/main.js`)).default as Extension;
				if (ext.heropack || ext.cardpack) {
					idx.pack = true;
				}
				if (ext.mode?.name) {
					idx.mode = ext.mode.name
				}
				if (ext.tags) {
					idx.tags = ext.tags;
				}
				if (ext.hero) {
					idx.images = Object.keys(ext.hero);
				}
				this.index[name] = idx;
			}
			catch (e) {
				console.log(e, name);
			}
		}
	}

    addMode(mode: string) {
        const ui = this.ui;
		const entry = ui.createElement('widget');
		const name = this.index[mode].mode;
		
		// set mode backgrround
		const bg = ui.createElement('image', entry);
		ui.setBackground(bg, 'extensions', mode, 'mode');
		
		// set caption
		const caption = ui.createElement('caption', entry);
		caption.innerHTML = name;

		// bind click
		ui.bindClick(entry, () => {
			if (this.splash.hidden) {
				return;
			}
			const packs = [];

			for (const name in this.index) {
				let add = true;

				if (!this.index[name].pack) {
					continue;
				}

				if (this.index[mode].tags) {
					for (const tag of this.index[mode].tags) {
						if (tag[tag.length-1] === '!') {
							if (!(this.index[name].tags?.includes(tag))) {
								add = false;
								break;
							}
						}
					}
				}
				
				if (add && this.index[name].tags) {
					for (const tag of this.index[name].tags) {
						if (tag[tag.length-1] === '!') {
							if (!(this.index[mode].tags?.includes(tag))) {
								add = false;
								break;
							}
						}
					}
				}
				
				if (add) {
					packs.push(name);
				}
			}

			this.client.connect([mode, packs]);
			this.splash.hide();
		});

		return entry
	}
}