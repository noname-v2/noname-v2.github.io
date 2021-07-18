import { Popup } from '../popup';

export class Dialog extends Popup {
    /** Use <noname-popup> as tag. */
    static tag = 'popup';

    /** Locate at center. */
    center = true;

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
    }

    $caption(val: string) {
        this.caption.innerHTML = val;
    }

    $content(val: string) {
        this.text.innerHTML = val;
    }

    $buttons(buttons: [string, string, string?][]) {
        this.buttons.innerHTML = '';
        for (const [id, text, color] of buttons) {
            const button = this.ui.createElement('widget.button');
            if (color) {
                button.dataset.fill = color;
            }
            button.innerHTML = text;
            this.buttons.appendChild(button);
        }
    }
}