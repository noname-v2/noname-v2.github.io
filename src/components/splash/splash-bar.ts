import { splash } from '../../client/globals';
import { version, debug } from '../../meta';
import { Component } from '../component';
import { Button, ButtonColor } from '../../types-client';

export class SplashBar extends Component {
    /** Use tag <noname-bar>. */
    static tag = 'bar';

    /** Button names and components. */
    buttons = new Map<string, Button>();

    init() {
        if (debug) {
            this.addButton('reset', '重置', 'red', () => this.#resetGame()).node.classList.remove('disabled');

            if (this.platform.mobile) {
                this.addButton('refresh', '刷新', 'purple', () => window.location.reload()).node.classList.remove('disabled');

                // eruda console
                const script = document.createElement('script');
                script.src = 'lib/eruda.js';
                script.onload = () => (window as any).eruda.init();
                document.head.appendChild(script);
            }
        }
        
        // add buttons
        this.addButton('workshop', '扩展', 'yellow', () => {});
        this.addButton('hub', '联机', 'green', () => splash.hub.open());
        this.addButton('settings', '选项', 'orange', () => splash.settings.open());

		// append to splash
		splash.node.appendChild(this.node);
    }

    /** Add a button. */
    addButton(id: string, caption: string, color: ButtonColor, onclick: () => void) {
        const button = this.ui.create('button');
        button.update({caption, color});
        button.onclick = onclick;
        button.node.classList.add('disabled');
        this.buttons.set(id, button);
        this.node.appendChild(button.node);
        return button;
    }

    async #resetGame() {
        if (window['caches']) {
            await window['caches'].delete(version);
        }

        for (const file of await this.db.readdir()) {
            if (file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.css')) {
                await this.db.writeFile(file, null);
            }
        }

        window.location.reload();
    }
}