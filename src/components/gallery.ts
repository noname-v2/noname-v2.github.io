import { Component } from '../components';

export class Gallery extends Component {
	/** Page container. */
	private pages: HTMLElement = this.ui.createElement('pages', this.node);

	/** Page indicator */
	private indicator: HTMLElement = this.ui.createElement('indicator', this.node);

    /** Number of rows. */
    private nrows!: number;

	/** Number of nodes in a row. */
    private ncols!: number;

	/** Width of the gallery */
	private width!: number;

	/** Whether other pages are visible. */
	private visible!: boolean;

    /** Index of current page. */
    private currentPage: number = 0;

	/** Currently being blocked. */
	private moving = false;

	/** Page creators. */
	private creators = new Map<HTMLElement, (add: (node: HTMLElement) => void) => void>();

	/** Block accelerated scrolling with mac trackpad. */
	private acceleration: (number | null)[] = [];
	private accelerationTimeout = 0;
	private scrollTimeout = 0;
	private smoothScroll = false;

	/** Current number of pages. */
	get pageCount() {
		return this.pages.childNodes.length;
	}

	/** Create page when needed. */
	private createPage(i: number) {
		const page = <HTMLElement>this.pages.childNodes[i];
		const creator = this.creators.get(page);

		if (page && creator) {
			this.creators.delete(page);

			for (let i = 0; i < this.nrows * this.ncols; i++) {
				page.firstChild!.appendChild(this.ui.createElement('item'));
			}

			let currentItem = 0;

			const add = (node: HTMLElement) => {
				page.firstChild?.childNodes[currentItem].appendChild(node);
				currentItem++;
			};

			creator(add);
		}
	}

	/** Turn page with mousewheel (with support for mac trackpad). */
	private wheel(e: WheelEvent) {
		if (this.moving) {
			return;
		}

		// save acceleration history
		const direction = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

		if (Math.abs(direction) > 5) {
			this.smoothScroll = true;
		}
		else if (this.smoothScroll) {
			return;
		}

		// mark wheel event as finished after 80ms without update
		clearTimeout(this.accelerationTimeout);
		this.accelerationTimeout = window.setTimeout(() => {
			this.acceleration.length = 0;
			this.accelerationTimeout = 0;
			clearTimeout(this.scrollTimeout);
			this.scrollTimeout = 0;
		}, 80);

		// detect continous scroll
		const idx = this.acceleration.indexOf(null);
		if (idx !== -1) {
			if (direction * <number>this.acceleration[0] < 0) {
				const a1 = <number>this.acceleration[this.acceleration.length - 1];
				const a2 = <number>this.acceleration[this.acceleration.length - 2];

				if (direction * a1 > 0 && direction * a2 > 0) {
					this.acceleration.length = 0;
				}
			}
			else {
				const acceleration = <number[]>this.acceleration.slice(idx + 1);
				acceleration.push(direction);

				let decreased = 0;
				let increased = 0;

				for (let i = acceleration.length - 1; i >= 1; i--) {
					const a1 = Math.abs(acceleration[i]);
					const a2 = Math.abs(acceleration[i - 1]);

					if (a1 > a2) {
						if (!increased) {
							decreased++;
						}
						else {
							break;
						}
					}
					else if (a1 < a2) {
						if (decreased < 2) {
							break;
						}
						else {
							increased += 1;

							if (increased >= 2) {
								this.acceleration.length = 0;
								break;
							}
						}
					}
				}

				if (acceleration.length >= 3) {
					let same = true;

					for (let i = 0; i < acceleration.length; i++) {
						if (acceleration[i] !== direction) {
							same = false;
							break;
						}
					}

					if (same) {
						this.acceleration.length = 0;
					}
				}
			}
		}

		this.acceleration.push(direction);

		if (this.acceleration.length === 1) {
			if (direction > 0) {
				this.turnPage(this.currentPage + 1);
			}
			else if (direction < 0) {
				this.turnPage(this.currentPage - 1);
			}
			
			clearTimeout(this.scrollTimeout);
			const timeout = this.scrollTimeout = window.setTimeout(() => {
				if (timeout === this.scrollTimeout) {
					this.acceleration.push(null);	
				}
			}, 100);
		}
	}

	init() {
		this.node.addEventListener('wheel', e => this.wheel(e), {passive: true});
	}

	addPage(creator: (add: (node: HTMLElement) => void) => void) {
		const page = this.ui.createElement('page');
		page.style.width = this.width + 'px';
		this.ui.createElement('layer', page);
        this.pages.appendChild(page);
		this.creators.set(page, creator);
		const dot = this.ui.createElement('dot', this.indicator);
		this.ui.createElement('layer', dot);
		this.ui.createElement('layer', dot);
		this.turnPage(0, false);
		requestAnimationFrame(() => {
			this.createPage(1);
		});
		if (this.pageCount > 1) {
			this.node.classList.add('with-indicator');
		}
	}

	turnPage(page: number, animate: boolean = true) {
		if (page >= this.pageCount || page < 0) {
			return
		}

		if (animate) {
			this.ui.animate(this.pages, {
				x: [-page * this.width], auto: true, forward: true
			});
		}

		this.currentPage = page;

		// update the move range of page container
		const offset = -this.currentPage * this.width;

		this.ui.bindMove(this.pages, {
			movable: {x: [-this.width * (this.pageCount - 1), 0], y: [0, 0]},
			offset: {x: offset, y: 0},
			onoff: (e1, e2) => {
				if (this.pageCount > 1) {
					const dx = e2.x - e1.x;
					const ref = this.width / 10 * (dx > 0 ? 1 : -1);
					return {x: e1.x + ref * (1 - 1 / Math.exp(dx / ref / 2)), y: e1.y};
				}
				else {
					return e1;
				}
			},
			onmove: ({x}: {x: number}) => {
				if (x < offset - this.width) {
					const n = Math.ceil((offset - this.width - x) / this.width);
					for (let i = 0; i < n; i++) {
						this.createPage(this.currentPage + 2 + i);
					}
				}
				if (this.visible) {
					const dx = x + this.currentPage * this.width;
					const current = this.pages.querySelector('.current');
					this.pages.classList.add('moving');

					if (current && dx) {
						const n = Math.abs(dx / this.width);
						const nodes = <(HTMLElement|null)[]>[current];
						const p = n - Math.floor(n);
						let node = current as any;
						for (let i = 0; i < n; i++) {
							if (dx < 0) {
								node = node?.nextSibling;
							}
							else {
								node = node?.previousSibling;
							}
							nodes.push(node);
						}
						for (let i = 0; i < nodes.length; i++) {
							node = nodes[i];
							if (!node) {
								continue;
							}
							if (i === nodes.length - 1) {
								node.style.opacity = Math.min(1, 1 - Math.cos(p * Math.PI));
							}
							else if (i === nodes.length - 2) {
								node.style.opacity = 1 + Math.cos((p + 1) * Math.PI / 2);
							}
							else {
								node.style.opacity = 0;
							}
						}
					}
				}
				return x;
			},
			onmoveend: x => {
				if (typeof x === 'number') {
					if (x > offset + 5) {
						this.turnPage(Math.max(0, this.currentPage - Math.ceil((x - offset - 5) / this.width)));
					}
					else if (x < offset - 5) {
						this.turnPage(Math.min(this.pageCount - 1, this.currentPage + Math.ceil((offset - 5 - x) / this.width)));
					}
					else if (x !== offset) {
						this.turnPage(this.currentPage);
					}
				}
				this.moving = false;
			},
			ondown: () => this.moving = true
		});

		// create current and next page
		this.createPage(page);

		if (animate) {
			this.createPage(page + 1);
		}

		// highlight current page
		if (this.visible) {
			this.pages.classList.remove('moving');
			for (const node of this.pages.childNodes) {
				(node as HTMLElement).style.opacity = '';
			}
			this.pages.querySelector('noname-page.current')?.classList.remove('current');
			(<HTMLElement>this.pages.childNodes[page]).classList.add('current');
		}

		// show indicator
		this.indicator.querySelector('.current')?.classList.remove('current');
		(<HTMLElement>this.indicator.childNodes[page]).classList.add('current');
	}

	setup(nrows: number, ncols: number, width: number, visible: boolean = false) {
		this.nrows = nrows;
		this.ncols = ncols;
		this.width = width;
		this.visible = visible;

		if (visible) {
			this.node.classList.add('visible');
		}
	}
}