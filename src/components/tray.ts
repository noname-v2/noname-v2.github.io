import { Component, Region } from '../components';

export class Tray extends Component {
	/** Item width. */
	width!: number;

	/** Default spacing between items. */
	margin!: number;

    /** Items and item indices. */
    items = new Map<HTMLElement, number>();

    init() {
        this.node.addEventListener('touchstart', e => e.stopPropagation(), {passive: false});
    }

    /** Set display mode. */
    setup(mode: 'round' | 'card') {
        if (mode === 'round') {
            const height = parseInt(this.app.css.pop['tray-height']);
            const margin = parseInt(this.app.css.pop['tray-margin']);
            this.width = height - 8;
            this.margin = margin;
            this.node.classList.add('round');
        }
    }

	/** Add an item. */
    add(node: HTMLElement, ref?: HTMLElement, callback?: () => void) {
        node.style.zIndex = this.items.size.toString();
        this.items.set(node, this.items.size);
        this.align();
        this.node.appendChild(node);
        
        const [dx, dy, scale, x] = this.#locate(node, ref);
        this.ui.animate(node, {
            x: [x + dx, x], y: [dy, 0], scale: [scale, 1], opacity: [0, 1]
        }).onfinish = callback ?? null;
    }

    /** Add an item without triggering align. */
    addSilent(node: HTMLElement) {
        node.style.zIndex = this.items.size.toString();
        this.items.set(node, this.items.size);
    }

    /** Remove an item. */
    delete(node: HTMLElement, ref?: HTMLElement, callback?: () => void, align?: boolean) {
        const idx = this.items.get(node)!;
        for (const [node, idx2] of this.items) {
            if (idx2 > idx) {
                this.items.set(node, idx2 - 1);
                node.style.zIndex = (idx2 - 1).toString();
            }
        }
        this.items.delete(node);

        if (align !== false) {
            this.align();
        }

        const [dx, dy, scale, x] = this.#locate(node, ref);
        this.ui.animate(node, {
            x: [x, x + dx], y: [0, dy], scale: [1, scale], opacity: [1, 0]
        }).onfinish = () => {
            node.remove();
            if (callback) {
                callback();
            }
        };
    }

    /** Remove an item without triggering align. */
    deleteSilent(node: HTMLElement) {
        this.delete(node, undefined, undefined, false);
    }

    align() {
        // determine spacing
        const n = this.items.size;
        const d = this.width;
        const m = this.margin;
        const width = this.node.clientWidth;
        let spacing: number;

        if ((width - m) / (d + m) > n) {
            // use margin as spacing
            spacing = m;
        }
        else if ((width - 4) / (d + 4) > n) {
            // spaced evenly
            spacing = (width - n * d) / (n + 1);
        }
        else {
            // leave 4px for left and right
            spacing = (width - 8 - d) / (n - 1) - d;
        }

        // determine left most location
        const length = d * n + spacing * (n - 1);
        const left = (width - length) / 2;

        // determine aligned location
        const x = (i: number) => left + i * (d + spacing);
        const movable: Region = {x: [left, x(this.items.size - 1)], y: [0, 0]};
        const move = (node: HTMLElement, i: number) => {
            this.ui.moveTo(node, {x: x(i), y: 0}, false);
            this.items.set(node, i);
        };

        // align items
        for (const node of this.items.keys()) {
            this.ui.bind(node, {
                movable,
                onmove: e => {
                    const j = Math.round((e.x - left) / (d + spacing));
                    let current = this.items.get(node)!;
                    if (j !== current) {
                        for (const [node2, k] of this.items) {
                            if (node2 === node) {
                                continue;
                            }
                            if (j < current && k < current && k >= j) {
                                move(node2, k + 1);
                            }
                            else if (j > current && k > current && k <= j) {
                                move(node2, k - 1);
                            }
                        }
                        this.items.set(node, j);
                    }
                },
                onmoveend: () => {
                    move(node, this.items.get(node)!);
                    for (const [node, idx] of this.items) {
                        node.style.zIndex = idx.toString();
                    }
                }
            });
            move(node, this.items.get(node)!);

            if (node.parentNode !== this.node) {
                this.node.appendChild(node);
                const x = this.ui.getX(node);
                this.ui.animate(node, {x: [x, x], opacity: [0, 1], scale: ['var(--app-zoom-scale)', 1]});
            }
        }
    }

    #locate(node: HTMLElement, ref: HTMLElement | undefined): [number, number, string | number, number] {
        const x = this.ui.getX(node);
        if (ref) {
            const rect1 = ref.getBoundingClientRect();
            const rect2 = node.getBoundingClientRect();
            const dx = (rect1.x + rect1.width / 2 - rect2.width / 2 - rect2.x) / this.app.zoom;
            const dy = (rect1.y + rect1.height / 2 - rect2.height / 2 - rect2.y) / this.app.zoom;
            const scale = rect1.width / rect2.width;
            return [dx, dy, scale, x];
        }
        else {
            return [0, 0, 'var(--app-zoom-scale)', x];
        }
    }
}