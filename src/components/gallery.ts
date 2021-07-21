import { Component } from '../components';

type GalleryItem = HTMLElement | (() => HTMLElement | null);

export class Gallery extends Component {
    /** Page container. */
    pages: HTMLElement = this.ui.createElement('pages', this.node);

    /** Page indicator */
    indicator: HTMLElement = this.ui.createElement('indicator', this.node);

    /** Number of rows. */
    nrows!: number | [number, number, number, number];

    /** Number of nodes in a row. */
    ncols!: number | [number, number, number, number];

    /** Number of pages. */
    pageCount = 0;

    /** Rendered pages. */
    private rendered = new Set<number>();

    /** Gallery items. */
    private items = <GalleryItem[]>[];

    /** Index of current page. */
    private currentPage: number = 0;

    /** Cache of item number per page. */
    private currentSize: [number, number] | null = null;

    /** Device can scroll horizontally. */
    private horizontal = false;

    /** Target page after multiple wheel input. */
    private targetPage: [number, number] | null = null;

    /** Clear target page after 0.5s without input. */
    private scrollTimeout = 0;

    /** Render page when needed. */
    private renderPage(i: number) {
        const page = <HTMLElement>this.pages.childNodes[i];

        if (!page || this.rendered.has(i)) {
            return;
        }
        this.rendered.add(i);

        const n = this.getSize();
        const layer = this.ui.createElement('layer');

        for (let j = 0; j < n; j++) {
            const item = this.items[i * n + j];
            if (j && j % this.currentSize![1] === 0) {
                layer.appendChild(document.createElement('div'));
            }
            if (typeof item === 'function') {
                const container = this.ui.createElement('item');
                const rendered = item();
                if (rendered) {
                    container.appendChild(rendered);
                }
                this.items[i * n + j] = container;
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

    /** Get number of items per page. */
    getSize(recalc: boolean = false) {
        if (!recalc && this.currentSize !== null) {
            return this.currentSize[0] * this.currentSize[1];
        }

        const calc = (n: [number, number, number, number], full: number) => {
            const [ratio, margin, spacing, length] = n;
            return Math.floor((ratio * full - 2 * margin) / (length + spacing * 2));
        };
        const nrows = typeof this.nrows === 'number' ? this.nrows : calc(this.nrows, this.ui.height);
        const ncols = typeof this.ncols === 'number' ? this.ncols : calc(this.ncols, this.ui.width);
        this.currentSize = [nrows, ncols];

        return nrows * ncols;
    }

    /** Update page count and create page(s) if necessary. */
    updatePages() {
        const pageCount = Math.ceil(this.items.length / this.getSize());

        // add more pages
        while (pageCount > this.pageCount) {
            this.pages.appendChild(this.ui.createElement('page'));
            const dot = this.ui.createElement('dot', this.indicator);
            if (pageCount === 1) {
                dot.classList.add('current');
            }
            this.ui.createElement('layer', dot);
            this.ui.createElement('layer', dot);
            this.pageCount++;
        }

        // remove extra pages
        while (pageCount < this.pageCount) {
            this.pages.lastChild!.remove();
            this.indicator.lastChild!.remove();
            this.pageCount--;
        }

        // show or hide page indicator
        this.node.classList[this.pageCount > 1 ? 'add' : 'remove']('with-indicator');
    }

    init() {
        // enable horizontal scroll
        this.pages.classList.add('scrollx');
        this.node.addEventListener('wheel', e => this.wheel(e), {passive: true});

        // render and update page indicator while scrolling
        this.pages.addEventListener('scroll', () => {
            this.checkPage();
            if (this.targetPage && this.targetPage[0] !== this.targetPage[1]) {
                const left = this.pages.scrollLeft;
                const width = this.pages.offsetWidth;
                const vel1 = this.targetPage[0] * width - left;
                const vel2 = this.targetPage[1] * width - left;
                if (vel1 * vel2 < 0 || Math.abs(vel2 / vel1) > 1.5) {
                    this.targetPage[0] = this.targetPage[1];
                    this.pages.scrollTo({left: this.targetPage[1] * width, behavior: 'smooth'});
                }
            }
        }, {passive: true});

        // add callbacks for dynamic item number
        if (Array.isArray(this.nrows)) {
            this.node.classList.add('centery');
            this.client.addListener('resize', this);
        }
        if (Array.isArray(this.ncols)) {
            this.node.classList.add('centerx');
            this.client.addListener('resize', this);
        }
    }

    /** Enable horizontal scroll with mouse wheel. */
    wheel(e: WheelEvent) {
        // disable this function if device can scroll horizontally
        if (e.deltaX !== 0) {
            this.horizontal = true;
            this.targetPage = null;
        }
        if (this.horizontal) {
            return;
        }

        // reset timeout
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = window.setTimeout(() => this.targetPage = null, 500);

        // turn page (used with scroll-snapping and scroll-behavior: smooth)
        const width = this.pages.offsetWidth;
        let targetPage = this.targetPage ? this.targetPage[1] : Math.round(this.pages.scrollLeft / width);
        targetPage += e.deltaY / Math.abs(e.deltaY);;
        if (targetPage < 0) {
            targetPage = 0;
            if (targetPage === this.currentPage) {
                return;
            }
        }
        else if (targetPage >= this.pageCount) {
            targetPage = this.pageCount - 1;
            if (targetPage === this.currentPage) {
                return;
            }
        }
        if (!this.targetPage) {
            this.targetPage = [targetPage, targetPage];
            this.pages.scrollTo({left: targetPage * width, behavior: 'smooth'});
        }
        else {
            this.targetPage[1] = targetPage;
        }
    }

    /** Add an item or an item constructor. */
    add(item: GalleryItem) {
        // wrap item with container
        if (typeof item === 'function') {
            this.items.push(item);
        }
        else {
            const container = this.ui.createElement('item');
            container.appendChild(item);
            this.items.push(container);
        }

        // re-render current page
        this.updatePages();
        this.rendered.delete(this.pageCount - 1);

        // render first 2 pages
        if (this.pageCount <= 2) {
            this.renderPage(this.pageCount - 1);
        }
    }

    /** Update current page after reopening. */
    checkPage() {
        const page = Math.round(this.pages.scrollLeft / this.node.offsetWidth);
        if (page !== this.currentPage) {
            this.turnPage(page);
        }
    }

    /** Update indicator and render nearby pages. */
    turnPage(page: number) {
        if (page >= this.pageCount || page < 0) {
            return
        }

        // update current page
        this.currentPage = page;
        if (this.targetPage && page === this.targetPage[1]) {
            this.targetPage = null;
        }

        // create current and sibling pages
        this.renderPage(page);
        this.renderPage(page + 1);
        this.renderPage(page - 1);

        // update page indicator
        this.indicator.querySelector('.current')?.classList.remove('current');
        (<HTMLElement>this.indicator.childNodes[page]).classList.add('current');
    }

    /** Callback when window resize. */
    resize() {
        if (!this.currentSize) {
            this.getSize();
        }
        const [nrows, ncols] = this.currentSize!;
        this.getSize(true);
        if (nrows !== this.currentSize![0] || ncols !== this.currentSize![1]) {
            this.rendered.clear();
            this.updatePages();
            if (this.currentPage >= this.pageCount) {
                this.currentPage = this.pageCount - 1;
            }
            this.turnPage(this.currentPage);
        }
    }
}