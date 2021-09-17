import { Component, TransitionDuration, Point } from '../components/component';

export class Popup extends Component {
    /** Child classes use tag <noname-popup> by default. */
    static tag = 'popup';

    /** Main content. */
    pane = this.ui.create('pane', this.node);

    /** Trigger when dialog is opened. */
	onopen: (() => void) | null = null;

    /** Trigger when dialog is closed. */
	onclose: (() => void) | null = null;

    /** Whether popup is closed when clicking on background layer. */
    temp: boolean = true;

	/** Built-in sizes. */
	size: 'portrait' | 'landscape' | null = null;

	/** Animation speed of open and close. */
	transition: TransitionDuration = null;

	/** Currently hidden. */
	hidden = true;

	/** Location when opened. */
	location?: Point;

	/** Append to app.arena instead of app. */
	arena: boolean = false;

	/** Locate dialog to [center, left] instead of [top, left]. */
	verticalCenter = false;

    init() {
		this.node.classList.add('noname-popup');
		
		// block DOM events behind the pane
        this.ui.bind(this.pane.node, () => {});

		// close when clicking on background layer
        this.ui.bind(this.node, () => {
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
			if (this.hidden) {
				this.node.remove();
			}
		};
	}

	open(location?: Point) {
		if (!this.hidden) {
			return;
		}
		this.hidden = false;
		location ??= this.location;

		if (!location) {
			this.node.classList.add('center');
		}

		if (typeof this.size === 'string') {
			this.node.classList.add(this.size);
		}

		this.node.classList.add('hidden');

		if (this.arena) {
			this.app.arena!.appZoom.node.appendChild(this.node);
		}
        else {
			this.app.zoomNode.appendChild(this.node);
		}

		if (location) {
			// determine position of the menu
			if (this.transition === null) {
				this.transition = 'fast';
			}

			let {x, y} = location;
			const rect1 = this.pane.node.getBoundingClientRect();
			const rect2 = this.app.zoomNode.getBoundingClientRect();
			const zoom = this.app.zoom;

			if (this.verticalCenter) {
				y -= rect1.height / 2;
			}

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