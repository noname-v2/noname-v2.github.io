import { Popup } from './popup';
import { Point } from '../components';

export class Menu extends Popup {
    /** Popup mode. */
    center = false;
    transition = 'fast' as const;

    /** Position of the click event. */
    position!: Point;

    open() {
        this.node.classList.add('hidden');
        this.app.node.appendChild(this.node);

        requestAnimationFrame(() => {
            // determine location of the menu
            let {x, y} = this.position;
            const rect1 = this.pane.node.getBoundingClientRect();
            const rect2 = this.app.node.getBoundingClientRect();
            const zoom = this.ui.zoom;
            this.node.classList.remove('hidden');

            x += 2;
            y -= 2;
        
            if (x < 10) {
                x = 10
            }
            else if (x + rect1.width / zoom + 10 > rect2.width / zoom) {
                x = rect2.width / zoom - 10 - rect1.width / zoom;
            }

            if (y < 10) {
                y = 10;
            }
            else if (y + rect1.height / zoom+ 10 > rect2.height / zoom) {
                y = rect2.height / zoom - 10 - rect1.height / zoom;
            }

            this.pane.node.style.left = x + 'px';
            this.pane.node.style.top = y + 'px';

            super.open();
        });
    }
}