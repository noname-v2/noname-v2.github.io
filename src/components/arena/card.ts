import { Component } from '../../components';

export class Card extends Component {
    /** Player background. */
    background = this.ui.createElement('background', this.node);

	/** Card image. */
	image = this.ui.createElement('image', this.background);

	/** Card name decoration. */
	decoration = this.ui.createElement('decoration', this.background);

	/** Card content. */
	content = this.ui.createElement('content', this.node);
	
	/** Card name. */
	name = this.ui.createElement('caption', this.content);

	/** Card label. */
	label = this.ui.createElement('label', this.content);

	/** Range of equips, */
	range = this.ui.createElement('range', this.content);

	/** Suit and number, */
	info = this.ui.createElement('info', this.content);

	/** Card suit. */
	suit = this.ui.createElement('span', this.info);

	/** Card suit. */
	number = this.ui.createElement('span', this.info);

	/** Card name. */
	$name(name: string) {
		this.node.classList.add('card-shown');
		const info = this.app.getCard(name);

		// card name
		let caption = info.caption || info.name;
		if (Array.isArray(caption)) {
			this.name.innerHTML = caption[0];
			this.ui.setColor(this.name, caption[1]);
			caption = caption[0];
		}
		else {
			this.name.innerHTML = caption;
		}
		this.name.className = '';
		if (info.caption && caption.length === 1) {
			this.name.classList.add('large');
		}
		else {
			if (caption.length === 2) {
				this.name.classList.add('short');
			}
			if (caption.length >= 4) {
				this.name.classList.add('long');
			}
			if (caption.length >= 5) {
				this.name.classList.add('vlong');
			}
			if (caption.indexOf('<br>') !== -1) {
				this.name.classList.add('duoline');
			}
		}

		// card name decoration
		if (info.decoration) {
			const [packname] = name.split(':');
			this.ui.setImage(this.decoration, packname + ':' + info.decoration);
		}

		// card image
		if (!this.data.image) {
			this.$image(name);
		}

		// card range
		if (!this.data.range) {
			this.$range(info);
		}

		// card label
		if (!this.data.label && info.label) {
			this.$label(info.label);
		}
	}

	/** Card backgound image. */
	$image(img: string) {
		this.ui.setImage(this.image, img);
	}

	/** Card suit. */
	$suit(suit?: string) {
		if (suit) {
			this.node.classList.add('suit-shown');
			let color = this.lib.color[suit];
			if (color === 'red') {
				color = 'darkred';
			}
			else if (color === 'black') {
				color = ''
			}
			this.info.dataset.text = color;
			this.suit.innerHTML = this.lib.suit[suit];
		}
		else {
			this.node.classList.remove('suit-shown');
			this.info.dataset.color = '';
			this.info.innerHTML = '';
		}
	}

	/** Card number. */
	$number(num: number) {
		const text = this.lib.number[num];
		this.number.innerHTML = text ?? '';
		if (text) {
			this.node.classList.add('number-shown');
		}
		else {
			this.node.classList.remove('number-shown');
		}
	}

	/** Card label. */
	$label(label?: string | [string, (string | null)?, string?, string?]) {
		this.label.innerHTML = '';

		if (typeof label === 'string' && this.lib.label[label]) {
			// pre-defined label
			label = this.lib.label[label];
		}
		
		if (Array.isArray(label)) {
			// label with color and intro
			this.label.innerHTML = label[0];
			if (label[1]) {
				this.ui.setColor(this.label, label[1]);
			}

			// context menu
			const name = label[2], intro = label[3];
			if (name || intro) {
				this.ui.bind(this.label, {oncontext: (e) => {
					const menu = this.ui.create('popup');
					menu.pane.width = 160;
                    menu.pane.node.classList.add('intro');
					if (name) {
						menu.pane.addCaption(name);
					}
					if (intro) {
						menu.pane.addText(intro);
					}
                    menu.open(e);
				}});
			}
		}
		else if (typeof label === 'string') {
			// text-only label
			this.label.innerHTML = label;
		}
	}

	/** Text showing card range */
	$range(info: {range?: number, distance?: number | [number, number]}) {
		if (info.range) {
			this.range.innerHTML = `范围<span>${info.range}</span>`;
		}
		else if (info.distance) {
			if (typeof info.distance === 'number') {
				const dist = info.distance > 0 ? '+' : '-';
				this.range.innerHTML = `<span class="smaller">${dist}</span><span>${Math.abs(info.distance)}</span>`;
			}
			else if (Array.isArray(info.distance)) {
				this.range.innerHTML = `<span class="tiny">+</span><span class="smaller">${Math.abs(info.distance[0])}</span>` +
				`<span class="tiny">/-</span><span class="smaller">${Math.abs(info.distance[1])}</span>`;
				this.range.classList.add('small')
			}
		}
	}
}