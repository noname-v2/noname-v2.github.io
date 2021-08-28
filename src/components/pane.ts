import { Component } from '../components';

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

	/** Add context menu item. */
	addOption(caption: string, onclick: () => void) {
		this.node.classList.add('menu');
		const option = this.ui.createElement('option');
		this.ui.format(option, caption);
		this.ui.bind(option, onclick);
		this.node.appendChild(option);
		return option;
	}

	/** Add a toggle. */
	addToggle(caption: string, onclick: (result: any) => void, choices?: [string | number, string][]) {
		const toggle = this.ui.create('toggle');
		toggle.setup(caption, onclick, choices);
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