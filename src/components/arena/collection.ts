import { Popup } from '../popup';
import type { Point, Gallery } from '../../components';

/** A collection of all items in an extension. */
export class Collection extends Popup {
    /** Gallery items. */
    items = new Map<string, HTMLElement>();

    /** Gallery object. */
    gallery!: Gallery;

    setup(pack: string, section: 'hero' | 'card', render?: (id: string, node: HTMLElement) => void) {
        const lib = this.app.accessExtension(pack, section);
        const n = Object.entries(lib ?? {}).length;
        if (lib && n) {
            this.pane.node.classList.add('auto');
            this.pane.addCaption(this.app.accessExtension(pack, section + 'pack'));
            const [gallery, width] = this.pane.addPopGallery(n);
            this.gallery = gallery;
            gallery.node.style.width = `${width}px`;

            for (const name in lib) {
                gallery.add(() => {
                    if (section === 'hero') {
                        const player = this.ui.create('player');
                        const id = pack + ':' + name;
                        player.setHero(id);
                        this.items.set(id, player.node);
                        if (render) {
                            render(id, player.node);
                        }
                        return player.node;
                    }
                    else {
                        
                    }
                });
            }
        }
    }

    async pop(e: Point) {
        this.location = e;
        await this.app.popup(this);
        this.gallery.checkPage();
    }
}