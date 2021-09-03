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
            const caption = this.pane.addCaption(this.app.accessExtension(pack, section + 'pack'));
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
                    // add pile toggle
                    const toggle = this.ui.createElement('widget', caption);
                    toggle.classList.add('toggle');
                    let shown = false;
                    let pileCount = 0;
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
                    const pileGallery = this.pileGallery = this.pane.addGallery(gallery.nrows as number, gallery.ncols as number);
                    pileGallery.node.style.display = 'none';
                    pileGallery.node.classList.add('pop');
                    pileGallery.node.style.width = `${width}px`;
                    pileGallery.node.style.height = `${height}px`;

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

                    toggle.innerHTML = `显示牌堆 (<span class="mono">${pileCount}</span>)`;
                    // if (debug) {
                    //     this.checkPile(pile);
                    // }
                }
            }
        }
    }

    async pop(e?: Point) {
        this.location = e;
        await this.app.popup(this);
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