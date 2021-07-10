import { Component, Popup } from '../../components';

export class Arena extends Component {
    /** Layout mode. */
	layout = 0;

	/** Player that is under control. */
	viewport = 0;

	/** Card container. */
	cards = this.ui.createElement('cards');

	/** Player container. */
	players = this.ui.createElement('players');

	init() {
		this.app.arena = this;
		this.app.node.appendChild(this.node);
	}

	/** Update arena layout. */
	resize(ax: number, ay: number, width: number, height: number) {
		// future: -> app.css['player-width'], etc.
		const np = this.get('np');
			
		if (np) {
			if (np >= 7 && width / height < (18 + (np - 1) * 168) / 720) {
				// wide 2-row layout
				[ax, ay] = [900, 755];
				this.layout = 1;
			}
			else {
				// normal 3-row layout
				if (np === 8) {
					ax = 1194;
				}
				else {
					ax = 1026;
				}
				ay = 620;
				this.layout = 0;
			}
		}

		return [ax, ay];
	}

	/** Remove arena. */
	remove() {
		this.ui.animate(this.node, {
			opacity: [1, 0]
		}).onfinish = () => {
			this.node.remove();
		};
	}

	/** Connection status change. */
    $peers() {
		for (const cmp of this.client.syncListeners) {
			cmp.sync();
		}
    }
}