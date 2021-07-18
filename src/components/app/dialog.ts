import { Popup } from '../popup';

export class Dialog extends Popup {
    /** Use <noname-popup> as tag. */
    static tag = 'popup';

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

    init() {
        super.init();
        this.pane.width = parseInt(this.app.css.popup['dialog-width']) - 20;
    }

    $caption(val: string) {
        this.caption.innerHTML = val;
    }

    $content(val: string) {
        (this.text.firstChild as HTMLElement).innerHTML = val;
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
            button.innerHTML = text;
            this.ui.bindClick(button, () => {
                this.result = id;
                this.close();
            });
            this.buttons.appendChild(button);
        }
    }
}