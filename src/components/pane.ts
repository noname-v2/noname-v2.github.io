import { Component, Gallery, Point } from '../components';
import type { ToggleOptions } from './toggle';

export class Pane extends Component {
	/** Pane width for text alignment. */
	width: number | null = null;

    /** Section title. */
	addSection(content: string) {
		const node = this.ui.createElement('section', this.node);
		this.ui.format(this.ui.createElement('span', node), content);
		return node;
	}

    /** Caption text. */
	addCaption(content: string, large: boolean = false) {
		const node = this.ui.createElement('caption', this.node);
		if (large) {
			node.classList.add('large');
		}
		this.ui.format(node, content);
		return node;
	}

    /** Caption text. */
	addText(content: string) {
		const node = this.ui.createElement('text', this.node);
		this.ui.format(this.ui.createElement('span', node), content);
		return node;
	}

    /** Add a group of custom elements. */
	add(tag: string) {
		return this.ui.createElement(tag, this.node);
	}

	/** Gallery of selectable items. */
	addGallery(nrows: number, ncols: number) {
		const gallery = this.ui.create('gallery');
		gallery.nrows = nrows;
		gallery.ncols = ncols;
		this.node.appendChild(gallery.node);
		return gallery;
	}

	/** Add a gallery containing heros or cards. */
	addPopGallery(n: number): [Gallery, number, number] {
		// values from theme
        const width = parseInt(this.app.css.pop.width);
        const height = parseFloat(this.app.css.player.ratio) * width;
        const margin = parseInt(this.app.css.pop.margin);

		// gallery size
        let nrows: number, ncols: number, galleryWidth: number, galleryHeight: number;

        if (n <= 5) {
            // single-row gallery
            ncols = n;
            nrows = 1;
			galleryWidth = n * (width + margin) + margin * 4;
            galleryHeight = height + margin * 2;
        }
        else {
            // double-row gallery
            ncols = 5;
            nrows = 2;
            galleryWidth = 5 * (width + margin) + margin * 4;
            galleryHeight = height * 2 + margin * 3;

            if (n > 10) {
                galleryHeight += 12;
            }
        }

		// add gallery
        const gallery = this.addGallery(nrows, ncols);
        gallery.node.classList.add('pop');
        gallery.node.style.height = `${galleryHeight}px`;
        gallery.node.addEventListener('mousedown', e => e.stopPropagation());

		return [gallery, galleryWidth, galleryHeight];
	}

	/** Add context menu item. */
	addOption(caption: string, onclick: (e: Point) => void) {
		this.node.classList.add('menu');
		const option = this.ui.createElement('option');
		this.ui.format(option, caption);
		this.ui.bind(option, onclick);
		this.node.appendChild(option);
		return option;
	}

	/** Add a toggle. */
	addToggle(...args: ToggleOptions) {
		const toggle = this.ui.create('toggle');
		toggle.setup(...args);
		this.node.appendChild(toggle.node);
		return toggle;
	}

	/** Align text nodes to center. */
	alignText() {
		for (const span of this.node.querySelectorAll<HTMLElement>('noname-pane > noname-text > noname-span')) {
			const dx = (this.width! - span.offsetWidth) / 2;
			(span.parentNode as HTMLElement).style.transform = `translateX(${dx}px)`;
		}
	}
}