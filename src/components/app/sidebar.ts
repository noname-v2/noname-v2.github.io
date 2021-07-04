import { Component, Pane } from '../../components';

export class Sidebar extends Component {
    // header text
	header = this.ui.createElement('caption', this.node);;

	// pane container
	pane = <Pane>this.ui.create('pane', this.node);

	// pane footer
	footer = this.ui.createElement('caption.footer', this.node);

    init() {
        // header with text and back button
        this.pane.enableScroll();
		this.ui.createElement('span', this.header);
		this.ui.createElement('image', this.header);
		this.ui.createElement('span', this.footer);
    }

    setHeader(caption: string, onclick: () => void) {
        this.ui.bindClick(this.header, onclick);
        (this.header.firstChild as HTMLElement).innerHTML = caption;
    }

    setFooter(caption: string, onclick: () => void) {
        this.ui.bindClick(this.footer, onclick);
        (this.footer.firstChild as HTMLElement).innerHTML = caption;
    }

    showFooter() {
        this.node.classList.add('with-footer');
    }

    hideFooter() {
        this.node.classList.remove('with-footer');
    }
}