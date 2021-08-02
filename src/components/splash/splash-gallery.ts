import { globals } from '../../client/globals';
import { Gallery } from '../gallery';
import { Splash } from '../../components';
import type { ExtensionMeta, Dict } from '../../types';

export class SplashGallery extends Gallery {
    /** Reference to Splash. */
    splash!: Splash;

    /** Single row. */
    nrows = 1;

	/** Extension index. */
	index!: Dict<ExtensionMeta>;

	/** Ordered extension list. */
	extensions!: string[];

    async init() {
		// determine gallery column number
		const margin = parseInt(this.app.css.app['splash-margin']);
		this.ncols = [1, margin * 2, margin, parseInt(this.app.css.player.width)];
        super.init();

		// get modes
		this.index = await this.db.readFile('extensions/index.json') || {};
		this.extensions = await this.utils.readJSON<string[]>('extensions/arrange.json');

		// udpate extension index
		let write = false;
		await Promise.all(this.extensions.map(async name => {
			if (!this.index[name]) {
				const meta = await this.client.getMeta(name);
				if (meta) {
					this.index[name] = meta;
					write = true;
				}
			}
		}));
		if (write) {
			await this.db.writeFile('extensions/index.json', this.index);
		}

		// add mode entries
		for (const name of this.extensions) {
			if (this.index[name]?.mode) {
				this.add(() => this.addMode(name));
			}
		}
    }

	/** Add a mode to gallery. */
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
			globals.client.connect([mode, this.#getPacks(mode)]);
			this.splash.hide();
		});

		return entry
	}

	/** Get hero / card packages from target mode. */
	#getPacks(mode: string) {
		const packs = [];
		for (const name of this.extensions) {
			if (!this.index[name].pack) {
				continue;
			}
			const modeTags = this.index[mode].tags;
			const packTags = this.index[name].tags;
			if (this.#checkTags(modeTags, packTags) && this.#checkTags(packTags, modeTags)) {
				packs.push(name);
			}
		}
		return packs;
	}

	/** Check if tags2 has all required tags of tags1. */
	#checkTags(tags1: string[] | undefined, tags2: string[] | undefined) {
		if (!tags1) {
			return true;
		}
		for (const tag of tags1) {
			if (tag.endsWith('!')) {
				if (!tags2) {
					return false;
				}
				if (!tags2.includes(tag) && !tags2.includes(tag.slice(0, -1))) {
					return false;
				}
			}
		}
		return true;
	}
}