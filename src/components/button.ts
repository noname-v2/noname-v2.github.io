import { Component } from '../components';

export class Button extends Component {
	// background circle image
	background = this.ui.createElement('background', this.node);

	// background colored image
	image = this.ui.createElement('image', this.background);

	// text container
	content = this.ui.createElement('content', this.node);

	$caption(caption: string) {
		this.content.innerHTML = '';
		const str1 = this.ui.createElement('caption');
		const str2 = this.ui.createElement('caption');
		str1.innerHTML = caption[0];
		str2.innerHTML = caption[1];
		this.content.appendChild(str1);
		this.content.appendChild(str2);
	}

	$color(color: string) {
		this.node.dataset.background = color;
	}
}