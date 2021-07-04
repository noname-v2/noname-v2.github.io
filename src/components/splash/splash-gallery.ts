import { Gallery } from '../gallery';
import { Splash } from '../../components';


interface ExtensionIndex {
	[key: string]: {
		mode: string;
		pack: boolean;
		tags: string[];
	}
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

    async init() {
        super.init();

        const extensions = await this.client.readJSON<ExtensionIndex>('extensions/index.json');
		const modeNames = <{[key: string]: string}>{};
		const modes = <string[]>[];

		for (const name in extensions) {
			if (extensions[name]['mode']) {
				modeNames[name] = extensions[name]['mode'];
				modes.push(name);
			}
		}

		for (let i = 0; i < modes.length; i += 5) {
			this.addPage(add => {
				for (let j = 0; j < 5; j++) {
					const mode = modes[i + j];
					if (mode) {
						add(this.addMode(mode, extensions));
					}
				}
			});
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