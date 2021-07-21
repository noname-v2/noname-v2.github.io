import { Component, TransitionDuration, Point } from '../components';

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
	location: Point | null = null;

	/** Built-in sizes. */
	size: 'portrait' | 'landscape' | null = null;

	/** Animation speed of open and close. */
	transition: TransitionDuration = null;

	/** Currently hidden. */
	hidden = true;

    init() {
		this.node.classList.add('noname-popup');
		
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

		
		if (this.location === null) {
			this.node.classList.add('center');
		}

		if (typeof this.size === 'string') {
			this.node.classList.add(this.size);
		}

		this.node.classList.add('hidden');
        this.app.node.appendChild(this.node);

		if (this.location) {
			// determine location of the menu
			if (this.transition === null) {
				this.transition = 'fast';
			}

			let {x, y} = this.location;
			const rect1 = this.pane.node.getBoundingClientRect();
			const rect2 = this.app.node.getBoundingClientRect();
			const zoom = this.ui.zoom;

			x += 2;
			y -= 2;
		
			if (x < 10) {
				x = 10
			}
			else if (x + rect1.width / zoom + 10 > rect2.width / zoom) {
				x = rect2.width / zoom - 10 - rect1.width / zoom;
			}

			if (y < 10) {
				y = 10;
			}
			else if (y + rect1.height / zoom+ 10 > rect2.height / zoom) {
				y = rect2.height / zoom - 10 - rect1.height / zoom;
			}

			this.pane.node.style.left = x + 'px';
			this.pane.node.style.top = y + 'px';
		}
		

		if (this.onopen) {
			this.onopen();
		}

		this.pane.alignText();
		this.node.classList.remove('hidden');
		this.ui.animate(this.pane.node, {
			opacity: [0, 1], scale: ['var(--popup-transform)', 1]
		}, this.app.getTransition(this.transition));
	}
}