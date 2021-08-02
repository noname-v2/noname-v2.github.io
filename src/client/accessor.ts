import { globals } from './globals';
import { importExtension } from '../extension';
import type { ExtensionMeta } from '../types';

/** Accessor to client and platform properties used by extensions. */
export class Accessor {
    /** OS info. */
    ios = false;
    android = false;
    mobile = false;
    mac = false;
    windows = false;
    linux = false;

    constructor() {
        if (navigator.userAgent.includes('Android')) {
            this.android = true;
            this.mobile = true;
        }
        else if (navigator.platform === 'iPhone' || (navigator.platform === 'MacIntel' && 'ontouchend' in document)) {
            this.ios = true;
            this.mobile = true;
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

    get version() {
        return globals.client.version;
    }

    get url() {
        return globals.client.url;
    }

    get info() {
        return globals.client.info;
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
			console.log(e, name);
            return null;
		}
    }
}