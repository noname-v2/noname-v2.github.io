import { Component } from '../components';

type GalleryItem = HTMLElement | (() => HTMLElement | null) | null;

export class Gallery extends Component {
	/** Page container. */
	pages: HTMLElement = this.ui.createElement('pages', this.node);

	/** Page indicator */
	indicator: HTMLElement = this.ui.createElement('indicator', this.node);

    /** Number of rows. */
    nrows!: number;

	/** Number of nodes in a row. */
    ncols!: number;

	/** Number of pages. */
	pageCount = 0;

	/** Rendered pages. */
	private rendered = new Set<number>();

	/** Gallery items. */
	private items = <GalleryItem[]>[];

    /** Index of current page. */
    private currentPage: number = 0;

	/** Device can scroll horizontally. */
	private horizontal = false;

	/** Create page when needed. */
	private renderPage(i: number) {
		const page = <HTMLElement>this.pages.childNodes[i];

		if (!page || this.rendered.has(i)) {
			return;
		}
		this.rendered.add(i);

		const start = this.nrows * this.ncols * i;
		const containers = document.createDocumentFragment();

		for (let i = 0; i < this.nrows * this.ncols; i++) {
			let item = this.items[start + i];
			if (typeof item === 'function') {
				item = this.items[start + i] = item();
			}

			let container = page.firstChild!.childNodes[i];

			if (!container) {
				container = this.ui.createElement('item');
				containers.appendChild(container);
			}

			if (item && !container.contains(item)) {
				container.appendChild(item);
			}
		}

		if (containers.childNodes.length) {
			page.firstChild!.appendChild(containers);
		}
	}

	init() {
		this.pages.classList.add('scrollx');
		this.pages.addEventListener('scroll', () => {
			const page = Math.round(this.pages.scrollLeft / this.node.offsetWidth);
			if (page !== this.currentPage) {
				this.turnPage(page);
			}
		}, {passive: true})
		this.node.addEventListener('wheel', e => this.wheel(e), {passive: true});
	}

	wheel(e: WheelEvent) {
		if (e.deltaX !== 0) {
			this.horizontal = true;
		}
		if (this.horizontal) {
			return;
		}
		this.pages.scrollLeft += this.pages.offsetWidth * e.deltaY / Math.abs(e.deltaY);
	}

	add(item: GalleryItem) {
		// page index
		const idx = Math.floor(this.items.length / (this.nrows * this.ncols))
		this.items.push(item);

		if (idx >= this.pageCount) {
			const page = this.ui.createElement('page');
			this.ui.createElement('layer', page);
			this.pages.appendChild(page);
			const dot = this.ui.createElement('dot', this.indicator);
			this.ui.createElement('layer', dot);
			this.ui.createElement('layer', dot);
			if (++this.pageCount > 1) {
				this.node.classList.add('with-indicator');
			}
			this.turnPage(0);
		}
		else {
			this.rendered.delete(idx);
		}

		if (idx < 2) {
			this.renderPage(idx);
		}
	}

	turnPage(page: number) {
		if (page >= this.pageCount || page < 0) {
			return
		}

		this.currentPage = page;

		// create current and next page
		this.renderPage(page);
		this.renderPage(page + 1);
		this.renderPage(page - 1);

		// show indicator
		this.indicator.querySelector('.current')?.classList.remove('current');
		(<HTMLElement>this.indicator.childNodes[page]).classList.add('current');
	}
}