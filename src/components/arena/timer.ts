import { Component } from '../../components';

export class Timer extends Component {
    /** Parent component. */
    parent!: {timer: Timer | null};

    /** Progress bar. */
    bar = this.ui.createElement('div', this.node);

    start(config: [number, number], parent: {timer: Timer | null}) {
        const [timeout, now] = config;
        this.parent = parent;
        this.parent.timer?.node.remove();
        this.parent.timer = this;
        const remaining = timeout - (Date.now() - now) / 1000;
        const x = -100 * (1 - remaining / timeout);
        this.bar.style.transform = `translateX(${x}px)`;
        this.ui.animate(this.node, {opacity: [0, 1]}).onfinish = () => {
            const remaining = timeout - (Date.now() - now) / 1000;
            this.ui.animate(this.bar, {x: [x, -100]}, {
                duration: remaining * 1000, easing: 'linear'
            }).onfinish = () => this.remove();
        };
    }

    remove() {
        if (this.parent.timer === this) {
            this.parent.timer = null;
            super.remove(this.ui.animate(this.node, {opacity: [1, 0]}));
        }
        else {
            super.remove();
        }
    }
}