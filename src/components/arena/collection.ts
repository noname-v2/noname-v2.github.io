import { debug } from '../../meta';
import { Popup } from '../popup';
import type { Point, Gallery } from '../../components';
import type { Pile, Dict } from '../../types';

/** A collection of all items in an extension. */
export class Collection extends Popup {
    /** Gallery items. */
    items = new Map<string, HTMLElement>();

    /** Gallery object. */
    gallery!: Gallery;

    /** Width of the gallery (if not this.flex). */
    galleryWidth?: number;

    /** Card pile gallery. */
    pileGallery?: Gallery;

    /** Card pile toggle. */
    pileToggle?: HTMLElement;

    /** Number of gallery columns. */
    nrows = 2;

    /** Number of gallery columns. */
    ncols = 5;

    /** Use dynamic nrows and ncols. */
    flex: boolean = false;

    /** Align to center vertically. */
    verticalCenter = true;

    setup(pack: string, type: 'hero' | 'card' | 'card+pile', render?: (id: string, node: HTMLElement) => void) {
        const section = type === 'card+pile' ? 'card' : type;
        const lib = this.app.accessExtension(pack, section);
        const n = Object.entries(lib ?? {}).length;
        if (lib && n) {
            const caption = this.pane.addCaption(this.app.accessExtension(pack, section + 'pack'));
            let gallery: Gallery;
            let width = 0;

            if (this.flex) {
                this.node.classList.add('flex-side');
                gallery = this.ui.create('gallery');
                gallery.node.classList.add('pop');
                const width = parseInt(this.app.css.pop.width);
                const margin = parseInt(this.app.css.pop.margin);
                const zoom = parseFloat(this.app.css.pop['flex-zoom']);
                gallery.ncols = [1, 110 + margin * 1.5, margin, width * zoom];
                gallery.nrows = [1, 30 + margin * 1.5, margin, width * zoom * parseFloat(this.app.css.player.ratio)];
                this.pane.node.appendChild(gallery.node);
            }
            else {
                this.pane.node.classList.add('auto');
                [gallery, width] = this.pane.addPopGallery(n, this.nrows, this.ncols);
                gallery.node.style.width = `${width}px`;
            }

            this.gallery = gallery;

            // add gallery items
            for (const name in lib) {
                gallery.add(() => {
                    let node;
                    const id = pack + ':' + name;
                    if (section === 'hero') {
                        const player = this.ui.create('player');
                        player.initHero(id);
                        node = player.node;
                        this.app.bindHero(node, id);
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
                    // add pile toggle
                    const toggle = this.pileToggle = this.ui.createElement('widget', caption);
                    toggle.classList.add('toggle');

                    let shown = false;
                    let pileCount = 0;

                    for (const name in pile) {
                        for (const suit in pile[name]) {
                            pileCount += pile[name][suit].length
                        }
                    }
                    toggle.innerHTML = `显示牌堆 (<span class="mono">${pileCount}</span>)`;

                    this.ui.bind(toggle, () => {
                        if (shown) {
                            pileGallery.node.style.display = 'none';
                            toggle.dataset.fill = '';
                            gallery.node.style.display = '';
                            gallery.checkPage();
                        }
                        else {
                            gallery.node.style.display = 'none';
                            toggle.dataset.fill = 'blue';
                            pileGallery.node.style.display = '';
                            pileGallery.checkPage();
                        }
                        shown = !shown;
                    });

                    // add pile gallery
                    let pileGallery: Gallery;
                    if (this.flex) {
                        pileGallery = this.ui.create('gallery');
                        pileGallery.node.classList.add('pop');
                        pileGallery.ncols = gallery.ncols;
                        pileGallery.nrows = gallery.nrows;
                        this.pane.node.appendChild(pileGallery.node);
                    }
                    else {
                        [pileGallery] = this.pane.addPopGallery(pileCount, this.nrows, this.ncols);
                        this.pileGallery = pileGallery;
                        pileGallery.node.style.display = 'none';
                        pileGallery.node.classList.add('pop');
                        pileGallery.node.style.width = `${width}px`;
                    }

                    for (const name in pile) {
                        const id = name.includes(':') ? name : pack + ':' + name;
                        for (const suit in pile[name]) {
                            for (const num of pile[name][suit]) {
                                pileCount++;
                                pileGallery.add(() => {
                                    const card = this.ui.create('card');
                                    card.data.name = id;
                                    card.data.suit = suit;
                                    if (typeof num === 'number') {
                                        card.data.number = num;
                                    }
                                    else {
                                        card.data.number = num[0];
                                        card.data.label = num.slice(1);
                                    }
                                    return card.node;
                                });
                            }
                        }
                    }

                    // if (debug) {
                    //     this.checkPile(pile);
                    // }
                }
            }
        }
    }

    async pop(e?: Point) {
        this.location = e;
        await this.app.arena!.popup(this);
        this.gallery.checkPage();
    }

    /** Check card numbers in pile. */
    checkPile(pile: Pile) {
        const suits: Dict<number> = {};
        const nums: Dict<number> = {};

        for (const name in pile) {
            for (const suit in pile[name]) {
                suits[suit] ??= 0;
                for (let num of pile[name][suit]) {
                    if (Array.isArray(num)) {
                        num = num[0]
                    }
                    const numstr = this.lib.number[num-1];
                    nums[numstr] ??= 0;
                    nums[numstr]++;
                    suits[suit]++;
                }
            }
        }

        console.log(suits);
        console.log(nums);
    }
}