import { Popup } from '../popup';
import type { Point, Gallery } from '../../components';

/** A collection of all items in an extension. */
export class Collection extends Popup {
    /** Gallery items. */
    items = new Map<string, HTMLElement>();

    /** Gallery object. */
    gallery!: Gallery;

    /** Number of gallery columns. */
    nrows = 2;

    /** Number of gallery columns. */
    ncols = 5;

    setup(pack: string, section: 'hero' | 'card', render?: (id: string, node: HTMLElement) => void) {
        const lib = this.app.accessExtension(pack, section);
        const n = Object.entries(lib ?? {}).length;
        if (lib && n) {
            this.pane.node.classList.add('auto');
            this.pane.addCaption(this.app.accessExtension(pack, section + 'pack'));
            const [gallery, width] = this.pane.addPopGallery(n, this.nrows, this.ncols);
            this.gallery = gallery;
            gallery.node.style.width = `${width}px`;

            for (const name in lib) {
                gallery.add(() => {
                    let node;
                    const id = pack + ':' + name;
                    if (section === 'hero') {
                        const player = this.ui.create('player');
                        player.initHero(id);
                        node = player.node;
                    }
                    else {
                        const card = this.ui.create('card');
                        card.data.name = id;
                        node = card.node;
                    }
                    this.items.set(id, node);
                    if (render) {
                        render(id, node);
                    }
                    return node;
                });
            }
        }
    }

    async pop(e?: Point) {
        this.location = e;
        await this.app.popup(this);
        this.gallery.checkPage();
    }
}