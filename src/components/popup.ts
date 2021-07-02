import { Component, Pane, Point, TransitionDuration } from '../components';

export class Popup extends Component {
    /** Main content. */
    pane = <Pane>this.ui.create('pane', this.node);

    /** Trigger when dialog is opened. */
	onopen: (() => void) | null = null;

    /** Trigger when dialog is closed. */
	onclose: (() => void) | null = null;

    /** Whether popup is closed when clicking on background layer. */
    temp: boolean = false;

	/** Animation speed of open and close. */
	transition: TransitionDuration = null;

    init() {
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
		if (this.onclose) {
			this.onclose();
		}
		this.ui.animate(this.pane.node, {
			opacity: [1, 0], scale: [1, 'var(--app-popup-transform)']
		}, this.app.getTransition(this.transition)).onfinish = () => {
			this.node.remove();
		};
	}

	open(position?: Point) {
        if (this.onopen) {
            this.onopen();
        }

		this.app.node.appendChild(this.node);

		if (position) {
			this.node.classList.remove('center');
			
			// determine location of the menu
			let {x, y} = position;
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
		else {
			this.node.classList.add('center');
		}

		this.ui.animate(this.pane.node, {
			opacity: [0, 1], scale: ['var(--app-popup-transform)', 1]
		}, this.app.getTransition(this.transition));
	}
}