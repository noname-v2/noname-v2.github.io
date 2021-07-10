import { Component, TransitionDuration } from '../components';

export class Popup extends Component {
    /** Main content. */
    pane = this.ui.create('pane', this.node);

    /** Trigger when dialog is opened. */
	onopen: (() => void) | null = null;

    /** Trigger when dialog is closed. */
	onclose: (() => void) | null = null;

    /** Whether popup is closed when clicking on background layer. */
    temp: boolean = true;

	/** Whether popup appears at the center. */
	center: boolean = true;

	/** Built-in sizes. */
	size: 'portrait' | 'landscape' | null = null;

	/** Animation speed of open and close. */
	transition: TransitionDuration = null;

	// currently hidden
	hidden = true;

    init() {
		this.node.classList.add('noname-popup');

		if (this.center) {
			this.node.classList.add('center');
		}

		if (typeof this.size === 'string') {
			this.node.classList.add(this.size);
		}
		
		// block DOM events behind the pane
        this.ui.bindClick(this.pane.node, () => {});

		// close when clicking on background layer
        this.ui.bindClick(this.node, () => {
            if (this.temp) {
                this.close();
            }
        });
    }

	close() {
		if (this.hidden) {
			return;
		}
		this.hidden = true;
		if (this.onclose) {
			this.onclose();
		}
		this.ui.animate(this.pane.node, {
			opacity: [1, 0], scale: [1, 'var(--popup-transform)']
		}, this.app.getTransition(this.transition)).onfinish = () => {
			this.node.remove();
		};
	}

	open() {
		if (!this.hidden) {
			return;
		}
		this.hidden = false;

        if (this.onopen) {
            this.onopen();
        }

		if (this.node.parentNode !== this.app.node) {
			this.app.node.appendChild(this.node);
		}

		this.ui.animate(this.pane.node, {
			opacity: [0, 1], scale: ['var(--popup-transform)', 1]
		}, this.app.getTransition(this.transition));
	}
}