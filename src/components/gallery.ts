import { Component } from '../components';

type GalleryItem = HTMLElement | (() => HTMLElement | null);

export class Gallery extends Component {
    /** Child classes use tag <noname-gallery> by default. */
    static tag = 'gallery';

    /** Page container. */
    pages: HTMLElement = this.ui.createElement('pages');

    /** Page indicator */
    indicator: HTMLElement = this.ui.createElement('indicator');

    /** Number of rows. */
    nrows!: number | [number, number, number, number];

    /** Number of nodes in a row. */
    ncols!: number | [number, number, number, number];

    /** Number of pages. */
    #pageCount = 0;

    /** Index of current page. */
    #currentPage: number = -1;

    /** Rendered pages. */
    #rendered = new Set<number>();

    /** Gallery items. */
    #items: GalleryItem[] = [];

    /** Cache of item number per page. */
    #currentSize: [number, number] | null = null;

    /** Scroll mode.
     * true: for devices that can scroll horizontally, scroll with CSS snap.
     * false: for mouse wheels, scroll with transform animation.
     */
    #snap = this.client.mobile || this.db.get('snap') || false;

    /** Listener for wheel event. */
    #wheelListener = (e: WheelEvent) => this.#wheel(e);

    init() {
        // enable horizontal scroll
        if (this.#snap) {
            this.switchToSnap();
        }
        else {
            this.node.addEventListener('wheel', this.#wheelListener, {passive: true});
        }
        this.node.appendChild(this.pages);
        this.node.appendChild(this.indicator);

        // add callbacks for dynamic item number
        if (Array.isArray(this.nrows)) {
            this.node.classList.add('centery');
            this.listeners.resize.add(this);
        }
        if (Array.isArray(this.ncols)) {
            this.node.classList.add('centerx');
            this.listeners.resize.add(this);
        }
    }

    /** Add an item or an item constructor. */
    add(item: GalleryItem) {
        // wrap item with container
        if (typeof item === 'function') {
            this.#items.push(item);
        }
        else {
            const container = this.ui.createElement('item');
            container.appendChild(item);
            this.#items.push(container);
        }

        // re-render current page
        this.updatePages();
        this.#rendered.delete(this.#pageCount - 1);
    }

    /** Get number of items per page. */
    getSize(recalc: boolean = false) {
        if (!recalc && this.#currentSize !== null) {
            return this.#currentSize[0] * this.#currentSize[1];
        }

        const calc = (n: [number, number, number, number], full: number) => {
            const [ratio, margin, spacing, length] = n;
            return Math.floor((ratio * full - 2 * margin) / (length + spacing * 2));
        };
        const nrows = typeof this.nrows === 'number' ? this.nrows : calc(this.nrows, this.ui.height);
        const ncols = typeof this.ncols === 'number' ? this.ncols : calc(this.ncols, this.ui.width);
        this.#currentSize = [nrows, ncols];

        return nrows * ncols;
    }

    /** Update page count and create page(s) if necessary. */
    updatePages() {
        const pageCount = Math.ceil(this.#items.length / this.getSize());

        // add more pages
        while (pageCount > this.#pageCount) {
            this.pages.appendChild(this.ui.createElement('page'));
            const dot = this.ui.createElement('dot', this.indicator);
            if (pageCount === 1) {
                dot.classList.add('current');
            }
            this.ui.createElement('layer', dot);
            this.ui.createElement('layer', dot);
            this.#pageCount++;
        }

        // remove extra pages
        while (pageCount < this.#pageCount) {
            this.pages.lastChild!.remove();
            this.indicator.lastChild!.remove();
            this.#pageCount--;
        }

        // show or hide page indicator
        this.node.classList[this.#pageCount > 1 ? 'add' : 'remove']('with-indicator');
    }

    /** Switch to snap mode. */
    switchToSnap() {
        this.pages.addEventListener('scroll', () => this.checkPage(), {passive: true});

        // enable scroll snapping
        this.pages.classList.add('snap');
        this.pages.classList.add('scrollx');
    }

    /** Update current page after reopening. */
    checkPage() {
        if (this.#snap) {
            const page = Math.round(this.pages.scrollLeft / this.node.offsetWidth);
            if (page !== this.#currentPage) {
                this.turnPage(page);
            }
        }
        else if (this.#currentPage < 0) {
            this.turnPage(0);
        }
    }

    /** Update indicator and render nearby pages. */
    turnPage(page: number) {
        if (page >= this.#pageCount || page < 0) {
            return
        }

        // update current page
        this.#currentPage = page;

        // create current and sibling pages
        this.#renderPage(page);
        this.#renderPage(page + 1);
        this.#renderPage(page - 1);

        // update page indicator
        this.indicator.querySelector('.current')?.classList.remove('current');
        (<HTMLElement>this.indicator.childNodes[page]).classList.add('current');
    }

    /** Callback when window resize. */
    resize() {
        if (!this.#currentSize) {
            this.getSize();
        }
        const [nrows, ncols] = this.#currentSize!;
        this.getSize(true);
        if (nrows !== this.#currentSize![0] || ncols !== this.#currentSize![1]) {
            this.#rendered.clear();
            this.updatePages();
            if (this.#currentPage >= this.#pageCount) {
                this.#currentPage = this.#pageCount - 1;
            }
            this.turnPage(this.#currentPage);
        }
    }

    /** Enable horizontal scroll with mouse wheel. */
    #wheel(e: WheelEvent) {
        // ignore in snap mode
        if (this.#snap) {
            return;
        }

        // switch to snap mode after animation finishes
        if (e.deltaX !== 0) {
            this.#snap = true;
            this.db.set('snap', true);
            this.node.removeEventListener('wheel', this.#wheelListener);
            setTimeout(() => {
                this.switchToSnap();
                this.pages.style.transform = '';
                this.pages.scrollLeft = this.#currentPage * this.pages.offsetWidth;
            }, this.app.getTransition());
            return;
        }

        // turn page
        const width = this.pages.offsetWidth;
        let targetPage = this.#currentPage + e.deltaY / Math.abs(e.deltaY);
        if (targetPage < 0) {
            targetPage = 0;
            if (targetPage === this.#currentPage) {
                return;
            }
        }
        else if (targetPage >= this.#pageCount) {
            targetPage = this.#pageCount - 1;
            if (targetPage === this.#currentPage) {
                return;
            }
        }

        // start animation
        this.turnPage(targetPage);
        this.ui.animate(this.pages, {
            x: [-targetPage*width], auto: true, forward: true
        }, this.app.getTransition('fast'));
    }

    /** Render page when needed. */
    #renderPage(i: number) {
        const page = this.pages.childNodes[i] as HTMLElement;
        if (!page || this.#rendered.has(i)) {
            return;
        }
        this.#rendered.add(i);

        const n = this.getSize();
        const layer = this.ui.createElement('layer');

        for (let j = 0; j < n; j++) {
            const item = this.#items[i * n + j];
            if (j && j % this.#currentSize![1] === 0) {
                layer.appendChild(document.createElement('div'));
            }
            if (typeof item === 'function') {
                const container = this.ui.createElement('item');
                const rendered = item();
                if (rendered) {
                    container.appendChild(rendered);
                }
                this.#items[i * n + j] = container;
                layer.appendChild(container);
            }
            else if (item) {
                layer.appendChild(item);
            }
            else {
                layer.appendChild(this.ui.createElement('item'));
            }
        }

        (page as any).replaceChildren(layer);
    }
}