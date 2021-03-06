import { splash } from '../../client/globals';
import { connect } from '../../client/client';
import { Gallery } from '../gallery';
import { importExtension } from '../../extension';
import type { Dict } from '../../types';

/** Format of extension meta data. */
interface ExtensionMeta {
    /** Mode name. */
    mode: string;

    /** Includes heropack or cardpack. */
    pack: boolean;

    /** Extension tags to determine whether it is enabled in a mode. */
    tags: string[];

    /** Images in addition to heros and cards. */
    images: string[];
}

export class SplashGallery extends Gallery {
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
				const meta = await this.#getMeta(name);
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

		// append to splash
		splash.node.appendChild(this.node);
    }

	/** Add a mode to gallery. */
    addMode(mode: string) {
		const entry = this.ui.createElement('widget');
		const name = this.index[mode].mode;
		
		// set mode backgrround
		const bg = this.ui.createElement('image', entry);
		this.ui.setBackground(bg, 'extensions', mode, 'mode');
		
		// set caption
		const caption = this.ui.createElement('caption', entry);
		this.ui.format(caption, name);

		// bind click
		this.ui.bind(entry, () => {
			if (splash.hidden) {
				return;
			}
			connect([mode, this.#getPacks(mode)]);
			splash.hide();
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

    /** Get extension meta data. */
    async #getMeta(pack: string) {
        try {
            const meta = {} as ExtensionMeta;
            const ext = await importExtension(pack);
			if (ext.heropack || ext.cardpack) {
				meta.pack = true;
			}
			if (ext.mode?.name) {
				meta.mode = ext.mode.name
			}
			if (ext.tags) {
				meta.tags = ext.tags;
			}
			if (ext.hero) {
				meta.images = Object.keys(ext.hero);
			}
			return meta;
		}
		catch (e) {
			console.log(e, pack);
            return null;
		}
    }
}