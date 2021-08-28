import { Popup } from '../popup';

export class Dialog extends Popup {
    /** Locate at center. */
    center = true;

    /** Don't close when clicking blank area. */
    temp = false;

    /** Dialog caption. */
    caption = this.pane.addCaption('', true);

    /** Dialog text. */
    text = this.pane.addText('');

    /** Dialog buttons. */
    buttons = this.pane.add('bar');

    /** Name of the button clicked. */
    result: string | null = null;

    /** Faster transition. */
    transition = 'fast' as const;

    init() {
        super.init();
        this.pane.width = parseInt(this.app.css.popup['dialog-width']) - 20;
    }

    $caption(val: string) {
        this.ui.format(this.caption, val);
    }

    $content(val: string) {
        this.ui.format(this.text.firstChild as HTMLElement, val);
        this.node.classList[val ? 'add' : 'remove']('with-content');
        this.pane.alignText();
    }

    $buttons(buttons: [string, string, string?][]) {
        this.buttons.innerHTML = '';
        for (const [id, text, color] of buttons) {
            const button = this.ui.createElement('widget.button');
            if (color) {
                button.dataset.fill = color;
            }
            this.ui.format(button, text);
            this.ui.bind(button, () => {
                this.result = id;
                this.close();
            });
            this.buttons.appendChild(button);
        }
    }
}