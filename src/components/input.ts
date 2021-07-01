import { Component } from '../components';

export class Input extends Component {
	// <input> element
	input!: HTMLInputElement;

	// clear input button
	clear = this.ui.createElement('clear');

	// callback when cleared or pressed enter
	callback?: (val: string) => void;

	init() {
		this.input = document.createElement('input');
		this.node.appendChild(this.input);
		this.node.appendChild(this.clear);

		this.input.onblur = () => {
			if (this.callback) {
				this.callback(this.input.value);
			}
		};

		this.ui.bindClick(this.clear, () => {
			this.input.value = '';
			this.input.focus();
		});
	}
}