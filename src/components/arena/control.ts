import { hub } from '../../client/client';
import { Component, Toggle, Player } from '../../components';
import type { Config, Dict } from '../../types';

export class Control extends Component {
    /** Sidebar for configurations. */
    sidebar = this.ui.create('sidebar', this.node);

    init() {
        this.node.classList.add('exclude');
        this.sidebar.ready.then(() => {
            this.sidebar.setHeader('返回', () => this.app.arena!.back());
        });
        
        // setup swipe area
        let xmin = 220;
        let blocked = false;
        this.ui.bind(this.node, {
            movable: {x: [0, 220], y: [0, 0]},
            onmove: e => {
                xmin = Math.min(xmin, e.x);
                this.updateZoom(e.x);
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

    show(x: number = 0) {
        this.app.arena!.arenaZoom.node.classList.add('control-blurred');
        this.app.arena!.appZoom.node.classList.add('control-blurred');
        this.ui.moveTo(this.node, {x: 220, y: 0}, false);
        this.node.style.opacity = '1';
        this.node.classList.remove('exclude');
        this.ui.animate(this.node, {
            x: [x, 220], opacity: [x / 220, 1]
        });
        this.#resetZoom();
    }

    hide(x: number = 220) {
        this.app.arena!.arenaZoom.node.classList.remove('control-blurred');
        this.app.arena!.appZoom.node.classList.remove('control-blurred');
        this.ui.moveTo(this.node, {x: 0, y: 0}, false);
        this.node.style.opacity = '';
        this.node.classList.add('exclude');
        this.ui.animate(this.node, {
            x: [x, 0], opacity: [x / 220, 0]
        });
        this.#resetZoom();
    }

    updateZoom(x: number) {
        this.ui.moveTo(this.node, {x, y: 0}, false);
        this.node.style.opacity = (x / 220).toString();

        // update arena opacity
        const blurred = parseFloat(this.app.css.app['blurred-opacity']);
        const opacity = (1 - Math.max(0, x - 20) / 200 * (1 - blurred)).toString();
        this.app.arena!.node.classList.add('no-transit');
        this.app.arena!.arenaZoom.node.style.opacity = opacity;
        this.app.arena!.appZoom.node.style.opacity = opacity;
    }

    #resetZoom() {
        this.app.arena!.node.classList.remove('no-transit');
        this.app.arena!.arenaZoom.node.style.opacity = '';
        this.app.arena!.appZoom.node.style.opacity = '';
    }
}