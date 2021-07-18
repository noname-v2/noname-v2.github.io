import { Popup } from '../popup';

export class Dialog extends Popup {
    /** Use <noname-popup> as tag. */
    static tag = 'popup';

    /** Locate at center. */
    center = true;

    /** Dialog caption. */
    caption = this.pane.addCaption('');

    /** Dialog text. */
    text = this.pane.addText('');

    /** Dialog buttons. */
    buttons = this.pane.addGroup();

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

    $buttons(buttons: {[key: string]: string | [string, string]}) {

    }
}