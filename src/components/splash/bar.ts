import { Component, Button, Splash } from '../../components';

export class SplashBar extends Component {
    /** Use tag <noname-bar>. */
    static tag = 'bar';

    /** Reference to Splash. */
    splash!: Splash;

    buttons = {
        /** Clear cached files and reload. */
        reset: <Button>this.ui.create('button'),

        /** Workshop button. */
        workshop: <Button>this.ui.create('button'),

        /** Hub button. */
        hub: <Button>this.ui.create('button'),

        /** Settings button. */
        settings: <Button>this.ui.create('button')
    }

    init() {
        // update button styles
        const buttons = [
            ['reset', '重置', 'red'],
            ['workshop', '工坊', 'yellow'],
            ['hub', '联机', 'green'],
            ['settings', '选项', 'orange']
        ];

        for (const [name, caption, color] of buttons) {
            const button = <Button>(this as any).buttons[name];
            button.update({caption, color});
            this.ui.bindClick(button.node, () => (this as any)[name]());
            button.node.classList.add('disabled');
            this.node.appendChild(button.node);
        }

        // hide reset button outside dev mode
        if (!this.client.debug) {
            this.buttons.reset.node.style.display = 'none';
        }
        else {
            this.buttons.reset.node.classList.remove('disabled');
        }
    }

    async reset() {
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

    workshop() {

    }

    hub() {
        this.splash?.hub.open();
    }

    settings() {
        this.splash?.settings.open();
    }
}