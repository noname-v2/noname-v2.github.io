import { debug } from '../../meta';
import { Popup } from '../popup';
import type { Point, Gallery, Pile, Dict } from '../../types-client';

/** A collection of all heros or cards in an extension. */
export class Collection extends Popup {
    /** Gallery items. */
    items = new Map<string, HTMLElement>();

    /** Gallery object. */
    gallery!: Gallery;

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

    setup(packs: string[], type: 'hero' | 'card' | 'card+pile', render?: (id: string, node: HTMLElement) => void) {
        const caption = this.pane.addCaption('<span></span>');
        const captionSpan = caption.firstChild as HTMLElement;
        const section = type === 'card+pile' ? 'card' : type;
        const pages: string[] = [];
        
        // total number of items
        let n = 0;
        for (const pack of packs) {
            n += Object.entries(this.app.accessExtension(pack, section)).length;
        }
        
        const gallery = this.#createGallery(n);
        gallery.node.classList.add('force-indicator');

        for (const pack of packs) {
            const lib = this.app.accessExtension(pack, section);
            const packname = this.app.accessExtension(pack, section + 'pack');

            if (pack === packs[0]) {
                captionSpan.innerHTML = packname;
            }

            // add gallery items
            const subpacks: Dict<string[]> = {};
            const defaults: string[] = [];
            for (const name in lib) {
                const subpack = lib[name].subpack;
                if (subpack) {
                    subpacks[subpack] ??= [];
                    subpacks[subpack].push(name);
                }
                else {
                    defaults.push(name);
                }
            }

            const add = (name: string) => {
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

            for (const subpack in subpacks) {
                pages.push(packname + '·' + subpack);
                for (const name of subpacks[subpack]) {
                    add(name);
                }
                gallery.add('pager');
            }

            pages.push(packname);
            for (const name of defaults) {
                add(name);
            }
            gallery.add('pager');
        }

        // change section title when tunning page.
        if (pages.length > 1) {
            gallery.onpage = page => {
                const items = gallery.items;
                const item = gallery.pagedItems[page * gallery.getSize()];
                const idx = items.indexOf(item);
                let npages = 0;
                for (let i = 0; i < idx; i++) {
                    if (items[i] === 'pager') {
                        npages++;
                    }
                }
                captionSpan.innerHTML = pages[npages];
            }
        }

        // add toggle for displaying card pile
        if (type === 'card+pile') {
            this.#addPile(packs, caption);
        }
    }

    /** Create a collection of arbitary heros. */
    setupHeros(caption: string, heros: string[], render?: (id: string, node: HTMLElement) => void) {
        this.pane.addCaption(caption);
        const gallery = this.#createGallery(heros.length);
        for (const id of heros) {
            gallery.add(() => {
                let node;
                const player = this.ui.create('player');
                player.initHero(id);
                node = player.node;
                this.app.bindHero(node, id);
                if (render) {
                    render(id, node);
                }
                return node;
            });
        }
    }

    /** Open collection. */
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

    /** Create main gallery. */
    #createGallery(n: number) {
        let gallery: Gallery;

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
            let width;
            this.pane.node.classList.add('auto');
            [gallery, width] = this.pane.addPopGallery(n, this.nrows, this.ncols);
            gallery.node.style.width = `${width}px`;
        }

        this.gallery = gallery;
        return gallery;
    }

    #addPile(packs: string[], caption: HTMLElement) {
        // total number of cards in card pile.
        let pileCount = 0;
        
        for (const pack of packs) {
            const pile = this.app.accessExtension(pack, 'pile') as Pile;
            for (const name in pile) {
                for (const suit in pile[name]) {
                    pileCount += pile[name][suit].length
                }
            }
        }
        
        if (pileCount === 0) {
            return;
        }
        
        const gallery = this.gallery;
        const toggle = this.pileToggle = this.ui.createElement('widget', caption);
        toggle.classList.add('toggle');
        toggle.innerHTML = `显示牌堆 (<span class="mono">${pileCount}</span>)`;
        
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
            pileGallery.node.style.display = 'none';
            pileGallery.node.classList.add('pop');
            pileGallery.node.style.width = this.gallery.node.style.width;
        }
        
        this.pileGallery = pileGallery;
        pileGallery.node.classList.add('force-indicator');
        
        // click to toggle card pile and card gallery
        let shown = false;
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


        for (const pack of packs) {
            const pile = this.app.accessExtension(pack, 'pile') as Pile;
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