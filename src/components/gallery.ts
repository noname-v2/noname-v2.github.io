import { Component } from '../components';

type GalleryItem = HTMLElement | (() => HTMLElement | null);

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

	/** Render page when needed. */
	private renderPage(i: number) {
		const page = <HTMLElement>this.pages.childNodes[i];

		if (!page || this.rendered.has(i)) {
			return;
		}
		this.rendered.add(i);

		const n = this.nrows * this.ncols;
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
		// page index to be inserted to
		const idx = Math.floor(this.items.length / (this.nrows * this.ncols));

		// wrap item with container
		if (typeof item === 'function') {
			this.items.push(item);
		}
		else {
			const container = this.ui.createElement('container');
			container.appendChild(item);
			this.items.push(container);
		}

		if (idx >= this.pageCount) {
			// create a new page
			const page = this.ui.createElement('page');
			this.pages.appendChild(page);
			const dot = this.ui.createElement('dot', this.indicator);
			this.ui.createElement('layer', dot);
			this.ui.createElement('layer', dot);
			if (++this.pageCount > 1 && !this.node.classList.contains('with-indicator')) {
				this.node.classList.add('with-indicator');
				(this.indicator.firstChild as HTMLElement).classList.add('current');
			}
		}
		else {
			// re-render current page
			this.rendered.delete(idx);
		}

		// render first 2 pages
		if (idx < 2) {
			this.renderPage(idx);
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
}