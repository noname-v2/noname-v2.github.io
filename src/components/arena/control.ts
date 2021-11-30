import { Component } from '../component';

export class Control extends Component {
    /** Sidebar for configurations. */
    sidebar = this.ui.create('sidebar', this.node);

    init() {
        this.node.classList.add('exclude');
        this.sidebar.ready.then(() => {
            this.sidebar.setHeader('返回', () => this.app.arena!.back());
        });
        
        // setup swipe area
        this.#setupSwipe();
        this.#setupControl();

        // append to arena
        this.app.arena!.controlZoom.node.appendChild(this.node);
    }

    show(x: number = 0) {
        this.ui.moveTo(this.node, {x: 220, y: 0}, false);
        this.node.style.opacity = '1';
        this.node.classList.remove('exclude');
        this.ui.animate(this.node, {
            x: [x, 220], opacity: [x / 220, 1]
        });
        this.ui.animate(this.app.arena!.main, {
            opacity: [this.#getOpacity(x), 'var(--app-blurred-opacity)']
        })
        this.app.arena!.main.style.opacity = 'var(--app-blurred-opacity)';
    }

    hide(x: number = 220) {
        this.ui.moveTo(this.node, {x: 0, y: 0}, false);
        this.node.style.opacity = '';
        this.node.classList.add('exclude');
        this.ui.animate(this.node, {
            x: [x, 0], opacity: [x / 220, 0]
        });
        this.ui.animate(this.app.arena!.main, {
            opacity: [this.#getOpacity(x), 1]
        })
        this.app.arena!.main.style.opacity = '';
    }

    #updateZoom(x: number) {
        this.ui.moveTo(this.node, {x, y: 0}, false);
        this.node.style.opacity = (x / 220).toString();

        // update arena opacity
        this.app.arena!.main.style.opacity = this.#getOpacity(x).toString();
    }

    #getOpacity(x: number) {
        const blurred = parseFloat(this.app.css.app['blurred-opacity']);
        return (1 - Math.max(0, x - 20) / 200 * (1 - blurred));
    }

    #setupSwipe() {
        const arena = this.app.arena!;

        let xmax = 0;
        let blocked = false;
        this.ui.bind(arena.swipe, {
            movable: {x: [0, 220], y: [0, 0]},
            onmove: e => {
                xmax = Math.max(xmax, e.x);
                this.#updateZoom(e.x);
                return e.x;
            },
            onmoveend: x => {
                if (!x || blocked) return;
                blocked = true;
                setTimeout(() => blocked = false, 200);
                this.ui.moveTo(arena.swipe, {x: 0, y: 0}, false);
                if (xmax > 50 && x > xmax - 5) {
                    this.show(x);
                }
                else {
                    this.hide(x);
                }
                xmax = 0;
            },
            oncontext: () => {
                if (blocked) return;
                blocked = true;
                xmax = 0;
                setTimeout(() => blocked = false, 200);
                this.show();
            }
        });
    }

    #setupControl() {
        let xmin = 220;
        let blocked = false;
        this.ui.bind(this.node, {
            movable: {x: [0, 220], y: [0, 0]},
            onmove: e => {
                xmin = Math.min(xmin, e.x);
                this.#updateZoom(e.x);
                return e.x;
            },
            onmoveend: x => {
                if (typeof x !== 'number' || x === 220 || blocked) return;
                blocked = true;
                setTimeout(() => blocked = false, 200);
                if (x < xmin + 5) {
                    this.hide(x);
                }
                else {
                    this.show(x);
                }
                xmin = 220;
            },
            onclick: () => {
                if (blocked) return;
                blocked = true;
                xmin = 220;
                setTimeout(() => blocked = false, 200);
                this.hide();
            }
        });
    }
}