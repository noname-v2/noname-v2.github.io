import { Component, Button, Splash, ButtonColor } from '../../components';

export class SplashBar extends Component {
    /** Use tag <noname-bar>. */
    static tag = 'bar';

    /** Reference to Splash. */
    splash!: Splash;

    /** Button names and components. */
    readonly buttons = new Map<string, Button>();

    init() {
        // add buttons
        if (this.client.debug) {
            this.addButton('reset', '重置', 'red', () => this.#resetGame()).node.classList.remove('disabled');
            if (this.client.mobile) {
                this.addButton('refresh', '刷新', 'purple', () => window.location.reload()).node.classList.remove('disabled');
            }
        }
        this.addButton('workshop', '扩展', 'yellow', () => {});
        this.addButton('hub', '联机', 'green', () => this.splash?.hub.open());
        this.addButton('settings', '选项', 'orange', () => this.splash?.settings.open());
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
        this.app.node.style.opacity = '0.5';
				
        if (window['caches']) {
            await window['caches'].delete(this.client.version);
        }

        for (const file of await this.db.readdir()) {
            if (file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.css')) {
                await this.db.writeFile(file, null);
            }
        }

        window.location.reload();
    }
}