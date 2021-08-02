import { globals } from './globals';
import { importExtension } from '../extension';
import type { ExtensionMeta } from '../types';

/** Accessor to client and platform properties used by extensions. */
export class Accessor {
    /** OS and platform info. */
    ios = false;

    android = false;

    mac = false;

    windows = false;
    
    linux = false;

    get version() {
        return globals.client.version;
    }

    get mobile() {
        return this.ios || this.android;
    }

    get url() {
        return globals.client.url;
    }

    get info() {
        return globals.client.info;
    }

	get assets() {
		return globals.app.assets;
	}

    constructor() {
        if (navigator.userAgent.includes('Android')) {
            this.android = true;
        }
        else if (navigator.platform === 'iPhone' || (navigator.platform === 'MacIntel' && 'ontouchend' in document)) {
            this.ios = true;
        }
        else if (navigator.platform === 'MacIntel') {
            this.mac = true;
        }
        else if (navigator.platform === 'Win32') {
            this.windows = true;
        }
        else if (navigator.platform.startsWith('Linux')) {
            this.linux = true;
        }
    }

    /** Get extension meta data. */
    async getMeta(pack: string, full: boolean = false) {
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

    /** Play background music. */
    playMusic() {
        globals.app.playMusic();
    }

    /** Swith background music. */
    switchMusic(bgm: string) {
        globals.app.switchMusic(bgm);
    }

    /** Change background music volume. */
    changeVolume(vol: number) {
		globals.app.changeVolume(vol);
    }

    /** Update theme. */
    loadTheme() {
        return globals.app.loadTheme();
    }

    /** Update background image. */
    loadBackground() {
        globals.app.loadBackground();
    }
}