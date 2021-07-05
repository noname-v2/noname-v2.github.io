import { Component, Menu } from '../components';

export class Toggle extends Component {
    // caption text
	span = this.ui.createElement('span', this.node);

	// switcher text
	text?: HTMLElement;

	// choices
	choices?: Map<string | number, string>;

	// disabled choices
	disabledChoices = new Set<string | number>();

	/** Requires confirmation when toggling to a value. */
	confirm?: any[];

	setup(caption: string, onclick: (result: any) => void, choices?: [string | number, string][]) {
		this.span.innerHTML = caption;
		
		if (choices) {
			// menu based switcher
			const popup = this.ui.createElement('text', this.node);
			this.text = this.ui.createElement('span', popup);
			this.ui.createElement('bar', popup);
			this.ui.bindClick(popup, () => {
				// open context menu
				const rect = popup.getBoundingClientRect();
                const menu = <Menu>this.ui.create('menu');
                for (const [id, name] of choices) {
                    menu.pane.addOption(name, () => {
						if (this.confirm?.includes(id)) {
							if (!confirm('确定将' + caption + '设为' + name + '？')) {
								return;
							}
						}
                        this.node.classList.add('fixed');
                        onclick(id);
						menu.close();
                    })
                }
				menu.position = {x: (rect.left + rect.width) / this.ui.zoom + 3, y: rect.top / this.ui.zoom - 3};
                menu.open();
			});

			// save captions corresponding to option values
			this.choices = new Map(choices);
		}
		else {
			// boolean switcher
			const switcher = this.ui.createElement('switcher', this.node);
			const container = this.ui.createElement('switcher-container', switcher);
			this.ui.createElement('switcher-background', container);
			this.ui.createElement('switcher-button', switcher);
			this.ui.bindClick(switcher, () => {
				const val = !this.node.classList.contains('on');
				if (this.confirm?.includes(val)) {
					if (!confirm('确定' + (val ? '开启' : '关闭') + caption + '？')) {
						return;
					}
				}
				this.node.classList.add('fixed');
                onclick(val);
			});
		}
	}

	// assign value
	assign(value: boolean | string | number) {
		if (typeof value === 'boolean') {
			// boolean toggle
			this.node.classList[value ? 'add' : 'remove']('on');
		}
		else if (this.text && this.choices) {
			// menu based switcher
			this.text.innerHTML = this.choices.get(value) || '';
		}

		// re-enable modification
		this.node.classList.remove('fixed');
	}
}