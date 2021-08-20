import { Component } from '../../components';

export class Sidebar extends Component {
    /** Header text. */
	header = this.ui.createElement('caption', this.node);;

	/** Pane container. */
	pane = this.ui.create('pane', this.node);

	/** Pane footer. */
	footer = this.ui.createElement('caption.footer', this.node);

    init() {
        this.pane.node.classList.add('scrolly');
		this.ui.createElement('span', this.header);
		this.ui.createElement('image', this.header);
		this.ui.createElement('span', this.footer);
    }

    /** Button at the top. */
    setHeader(caption: string, onclick: () => void) {
        this.ui.bind(this.header, onclick);
        (this.header.firstChild as HTMLElement).innerHTML = caption;
    }

    /** Button at the bottom. */
    setFooter(caption: string, onclick: () => void) {
        this.ui.bind(this.footer, onclick);
        (this.footer.firstChild as HTMLElement).innerHTML = caption;
    }

    /** Show button at the bottom. */
    showFooter() {
        this.node.classList.add('with-footer');
    }

    /** Hide button at the bottom. */
    hideFooter() {
        this.node.classList.remove('with-footer');
    }
}