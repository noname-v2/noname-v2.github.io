import { Component } from '../components';

export class Pane extends Component {
    /** Section title. */
	addSection(content: string) {
		const node = this.ui.createElement('section', this.node);
		this.ui.createElement('span', node).innerHTML = content;
		return node;
	}

    /** Caption text. */
	addCaption(content: string, large: boolean = false) {
		const node = this.ui.createElement('caption', this.node);
		if (large) {
			node.classList.add('large');
		}
		node.innerHTML = content;
		return node;
	}

    /** Caption text. */
	addText(content: string) {
		const node = this.ui.createElement('text', this.node);
		this.ui.createElement('span', node).innerHTML = content;
		return node;
	}

    /** Add a group of custom elements. */
	add(tag: string) {
		return this.ui.createElement(tag, this.node);
	}

	/** Gallery of selectable items. */
	addGallery(nrows: number, ncols: number, width: number) {
		const gallery = this.ui.create('gallery');
		gallery.nrows = nrows;
		gallery.ncols = ncols;
		gallery.width = width;
		this.node.appendChild(gallery.node);
		return gallery;
	}

	/** Add context menu item. */
	addOption(caption: string, onclick: () => void) {
		const option = this.ui.createElement('option');
		option.innerHTML = caption;
		this.ui.bindClick(option, onclick);
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

	/** Enable vertical scrolling. */
	enableScroll() {
		this.ui.enableScroll(this.node);
	}
}