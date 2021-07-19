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

	/** Cache of size before document resize. */
	private currentSize!: number;

	/** Device can scroll horizontally. */
	private horizontal = false;

	/** Render page when needed. */
	private renderPage(i: number) {
		const page = <HTMLElement>this.pages.childNodes[i];

		if (!page || this.rendered.has(i)) {
			return;
		}
		this.rendered.add(i);

		const n = this.currentSize;
		const layer = this.ui.createElement('layer');

		for (let j = 0; j < n; j++) {
			const item = this.items[i * n + j];
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
	get size() {
		const calc = (n: [number, number, number, number], full: number) => {
			const [ratio, margin, spacing, length] = n;
			return Math.floor((ratio * full - 2 * margin) / (length + spacing * 2));
		};
		const nrows = typeof this.nrows === 'number' ? this.nrows : calc(this.nrows, this.ui.height);
		const ncols = typeof this.ncols === 'number' ? this.ncols : calc(this.ncols, this.ui.width);
		return nrows * ncols;
	}

	/** Update page count and create page(s) if necessary. */
	updatePages() {
		const pageCount = Math.ceil(this.items.length / this.currentSize);

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
			const page = Math.round(this.pages.scrollLeft / this.node.offsetWidth);
			if (page !== this.currentPage) {
				this.turnPage(page);
			}
		}, {passive: true});

		// add callbacks for dynamic item number
		if (Array.isArray(this.nrows)) {
			this.node.classList.add('centery');
			this.client.resizeListeners.add(this);
		}
		if (Array.isArray(this.ncols)) {
			this.node.classList.add('centerx');
			this.client.resizeListeners.add(this);
		}

		// get number of items in a page
		this.currentSize = this.size;
	}

	/** Enable horizontal scroll with mouse wheel. */
	wheel(e: WheelEvent) {
		// disable this function if device can scroll horizontally
		if (e.deltaX !== 0) {
			this.horizontal = true;
		}
		if (this.horizontal) {
			return;
		}
		// turn page (used with scroll-snapping and scroll-behavior: smooth)
		this.pages.scrollLeft += this.pages.offsetWidth * e.deltaY / Math.abs(e.deltaY);
	}

	/** Add an item or an item constructor. */
	add(item: GalleryItem) {
		// wrap item with container
		if (typeof item === 'function') {
			this.items.push(item);
		}
		else {
			const container = this.ui.createElement('container');
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

	/** Update indicator and render nearby pages. */
	turnPage(page: number) {
		if (page >= this.pageCount || page < 0) {
			return
		}
		this.currentPage = page;

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
		const size = this.size;
		if (size !== this.currentSize) {
			this.currentSize = size;
			this.rendered.clear();
			this.updatePages();
			if (this.currentPage >= this.pageCount) {
				this.currentPage = this.pageCount - 1;
			}
			this.turnPage(this.currentPage);
		}
	}
}