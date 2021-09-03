import { Popup } from '../popup';
import type { Point, Gallery } from '../../components';
import type { Pile } from '../../types';

/** A collection of all items in an extension. */
export class Collection extends Popup {
    /** Gallery items. */
    items = new Map<string, HTMLElement>();

    /** Gallery object. */
    gallery!: Gallery;

    /** Card pile gallery. */
    pileGallery?: Gallery;

    /** Number of gallery columns. */
    nrows = 2;

    /** Number of gallery columns. */
    ncols = 5;

    setup(pack: string, type: 'hero' | 'card' | 'card+pile', render?: (id: string, node: HTMLElement) => void) {
        const section = type === 'card+pile' ? 'card' : type;
        const lib = this.app.accessExtension(pack, section);
        const n = Object.entries(lib ?? {}).length;
        if (lib && n) {
            this.pane.node.classList.add('auto');
            this.pane.addCaption(this.app.accessExtension(pack, section + 'pack'));
            const [gallery, width, height] = this.pane.addPopGallery(n, this.nrows, this.ncols);
            this.gallery = gallery;
            gallery.node.style.width = `${width}px`;

            // add gallery items
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

            // add card pile
            if (type === 'card+pile') {
                const pile = this.app.accessExtension(pack, 'pile') as Pile;
                if (pile) {
                    const pileGallery = this.pileGallery = this.pane.addGallery(gallery.nrows as number, gallery.ncols as number);
                    pileGallery.node.classList.add('pop');
                    pileGallery.node.style.width = `${width}px`;
                    pileGallery.node.style.height = `${height}px`;

                    for (let name in pile) {
                        const id = pack + ':' + name;
                        for (const suit in pile[name]) {
                            for (const num of pile[name][suit]) {
                                pileGallery.add(() => {
                                    const card = this.ui.create('card');
                                    card.data.name = id;
                                    card.data.suit = suit;
                                    console.log(id, suit, num)
                                    if (typeof num === 'number') {
                                        card.data.number = num;
                                    }
                                    return card.node;
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    async pop(e?: Point) {
        this.location = e;
        await this.app.popup(this);
        this.gallery.checkPage();
        this.pileGallery?.checkPage();
    }
}