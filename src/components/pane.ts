import { Component, Gallery, Toggle } from '../components';

export class Pane extends Component {
    /** Section title. */
	addSection(caption: string) {
		const section = this.ui.createElement('section', this.node);
		this.ui.createElement('span', section).innerHTML = caption;
		return section;
	}

	/** Gallery of selectable items. */
	addGallery(nrows: number, ncols: number, width: number) {
		const gallery = <Gallery>this.ui.create('gallery');
		gallery.setup(nrows, ncols, width);
		this.node.appendChild(gallery.node);
		return gallery;
	}

	/** Add context menu item. */
	addOption(caption: string, onclick: () => void) {
		this.node.classList.add('menu');
		const option = this.ui.createElement('option');
		option.innerHTML = caption;
		this.ui.bindClick(option, onclick);
		this.node.appendChild(option);
		return option;
	}

	/** Add a toggle. */
	addToggle(caption: string, onclick: (result: any) => void, choices?: [string | number, string][]) {
		const toggle = <Toggle>this.ui.create('toggle');
		toggle.setup(caption, onclick, choices);
		this.node.appendChild(toggle.node);
		return toggle;
	}

	/** Enable vertical scrolling. */
	enableScroll() {
		this.ui.enableScroll(this.node);
	}
}