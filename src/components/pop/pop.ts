import { Popup } from '../popup';
import type { Player } from '../../types-client';
import type { ClientSelect } from '../../types';

export class Pop extends Popup {
    /** Pop caption. */
    caption?: string;

    /** Configuration for selecting items. */
    player!: Player;

    /** Include a tray to put selected items. */
    tray!: boolean;

    /** Additional buttons in confirm bar.
     * Built-in buttons: OK, cancel
     * Custom buttons: [id, text, color]
     */
    bar?: ('ok' | 'cancel' | [string, string, string?])[];

    /** Items in gallery */
    items = new Map<string | number, HTMLElement>();

    /** Items in tray. */
    clones = new Map<string | number, HTMLElement>();

    /** Buttons in this.bar. */
    buttons = new Map<string, HTMLElement>();

    /** Height based on content height. */
    height = 24;
    
    /** Width based on content width. */
    width = 0;

    init() {
        this.addCaption();
        this.addItems();
        this.addBar();
        this.addTray();
    }

    addItems() {};

    /** Callback when clicking this.items or this.clones. */
    click(id: string | number) {

    }

    /** Add Pop caption. */
    addCaption() {
        if (!this.caption) {
            return;    
        }

        this.pane.addCaption(this.caption);
        this.height += 50;
    }

    /** Add buttons in bottom bar. */
    addBar() {
        if (!this.bar) {
            return;
        }

        this.height += 50;
        this.width = Math.max(this.width, 230);

        const bar = this.pane.add('bar');

        for (const item of this.bar!) {
            if (item === 'ok') {
                const ok = this.ui.createElement('widget.button', bar);
                this.buttons.set('ok', ok);
                ok.dataset.fill = 'red';
                ok.innerHTML = '确定';
                this.ui.bind(ok, () => {
                    // this.respond(this.getSelected());
                    this.remove();
                });
            }
            else if (item === 'cancel') {
                const cancel = this.ui.createElement('widget.button', bar);
                this.buttons.set('cancel', cancel);
                cancel.innerHTML = '取消';
                this.ui.bind(cancel, () => {
                    // this.respond(false);
                    this.remove();
                });
            }
            else {
                // custom operation that is processed by worker
                const button = this.ui.createElement('widget.button', bar);
                const [id, text, color] = item;
                this.buttons.set(id, button);
                this.ui.format(button, text);
                if (color) {
                    button.dataset.fill = color;
                }
                this.ui.bind(button, e => {
                    this.yield([id, {x: e.x, y: e.y}]);
                });
            }
        }
    }

    /** Add a tray that contains item clones. */
    addTray() {
        const height = parseInt(this.app.css.pop['tray-height']);
        const tray = this.pane.addTray('round');
        this.height += height + 26;

        return tray;
    }

    $select(cs: Partial<ClientSelect> | null, old?: Partial<ClientSelect>, partial?: boolean) {
        if (!cs) {
            // close dialog after selection done
            this.remove();
        }
        else {
            if (!partial && !cs.items && !cs.links) {
                // pop initialized with no item
                throw('no item added');
            }
            
        }
    }
}