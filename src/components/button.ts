import { Component, ButtonColor } from '../components/component';

export class Button extends Component {
	/** Background circle image. */
	background = this.ui.createElement('background', this.node);

	/** Background colored image. */
	image = this.ui.createElement('image', this.background);

	/** Text container. */
	content = this.ui.createElement('content', this.node);

	/** Click callback. */
	onclick: (() => void) | null = null;

	init() {
		this.ui.bind(this.node, () => {
			if (this.onclick) {
				this.onclick();
			}
		});
	}

	$caption(caption: string) {
		this.content.innerHTML = '';
		const str1 = this.ui.createElement('caption');
		const str2 = this.ui.createElement('caption');
		str1.innerHTML = caption[0];
		str2.innerHTML = caption[1];
		this.content.appendChild(str1);
		this.content.appendChild(str2);
	}

	$color(color: ButtonColor) {
		this.image.dataset.bcolor = color;
	}
}