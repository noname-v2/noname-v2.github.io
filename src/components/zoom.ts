import { Component } from '../components/component';

export class Zoom extends Component {
	/** Actual element width without scaling. */
	width!: number;

	/** Actual element width without scaling. */
	height!: number;

	/** Element zoom. */
	zoom!: number;

	/** Change zoom based on ideal width and height */
	scale(ax: number, ay: number, width: number, height: number, node?: HTMLElement) {
		// zoom to fit ideal size
        const zx = width / ax, zy = height / ay;

        if (zx < zy) {
            this.width = ax;
            this.height = ax / width * height;
            this.zoom = zx;
        }
        else {
            this.width = ay / height * width;
            this.height = ay;
            this.zoom = zy;
        }

        // update styles
		node ??= this.node;
        node.style.setProperty('--zoom-width', this.width + 'px');
        node.style.setProperty('--zoom-height', this.height + 'px');
        node.style.setProperty('--zoom-scale', this.zoom.toString());
	}
}