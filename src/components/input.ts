import { Component, Point } from '../components';

export class Input extends Component {
	// <input> element
	input!: HTMLInputElement;

	// icon in <input>
	icon = this.ui.createElement('icon');

	// callback when blur or pressed enter
	callback: ((val: string) => void | Promise<void>) | null = null;

	// callback when clicking icon
	onicon: ((e: Point) => void | Promise<void>) | null = null;

	init() {
		this.input = document.createElement('input');
		this.node.appendChild(this.input);
		this.node.appendChild(this.icon);

		this.input.onfocus = () => {
			if (!this.input.disabled && this.input.value.length) {
				this.input.setSelectionRange(0, this.input.value.length);
			}
		};
		this.input.onblur = async () => {
			if (this.callback && !this.input.disabled) {
				getSelection()?.removeAllRanges();
				this.input.disabled = true;
				await this.callback(this.input.value);
				this.input.disabled = false;
			}
		};
		this.input.onkeyup = e => {
			if (e.key === 'Enter') {
				this.input.blur();
			}
		};

		this.input.ontouchstart = () => {
			if (this.input.disabled) {
				return;
			}
			const val = this.input.value;
			this.input.disabled = true;
			this.input.value = prompt('', this.input.value) || val;
			Promise.all([
				new Promise(resolve => setTimeout(resolve, 100)),
				new Promise<void>(async resolve => {
					if (this.callback) {
						await this.callback(this.input.value);
					}
					resolve();
				})
			]).then(() => this.input.disabled = false);
		};

		this.ui.bindClick(this.icon, e => {
			if (this.onicon) {
				this.onicon(e);
			}
		});
	}

	$icon(name: string) {
		if (name) {
			this.node.classList.add('with-icon');
			this.icon.style.backgroundImage = `var(--icon-${name})`;
		}
		else {
			this.node.classList.remove('with-icon');
		}
	}
}