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
        this.ui.bind(this.node, () => {
            this.hide();
            this.ui.animate(this.node, {
                x: [220, 0], opacity: [1, 0]
            });
        });
    }

    show() {
        this.app.arena!.arenaZoom.node.classList.add('control-blurred');
        this.app.arena!.appZoom.node.classList.add('control-blurred');
        this.node.style.transform = 'translateX(220px)';
        this.node.style.opacity = '1';
        this.node.classList.remove('exclude');
    }

    hide() {
        this.app.arena!.arenaZoom.node.classList.remove('control-blurred');
        this.app.arena!.appZoom.node.classList.remove('control-blurred');
        this.node.style.transform = '';
        this.node.style.opacity = '';
        this.node.classList.add('exclude');
    }
}