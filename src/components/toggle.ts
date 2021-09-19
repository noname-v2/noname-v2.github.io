import { Component, Point } from '../components/component';

export type ToggleOptions = [
    string | [string, string] | [string, (e: Point) => void],
    (result: any) => void,
    [string | number, string][]?
];

export class Toggle extends Component {
    /** Caption text. */
    span = this.ui.createElement('span', this.node);

    /** Switcher text. */
    text?: HTMLElement;

    /** Choices. */
    choices?: Map<string | number, string>;

    /** Disabled choices. */
    disabledChoices = new Set<string | number>();

    /** Requires confirmation when toggling to a value. */
    confirm = new Map<string | number | boolean, [string | null, string?]>();

    /** Toggle intro. */
    intro?: string;

    setup(...[caption, onclick, choices]: ToggleOptions) {
        if (Array.isArray(caption)) {
            this.ui.format(this.span, caption[0]);
            const onclick = (e: Point) => {
                if (typeof caption[1] === 'function') {
                    caption[1](e);
                }
                else {
                    this.app.intro(e, caption[1]);
                }
            };
            this.ui.bindClick(this.span, onclick);

            // save intro for reference
            if (typeof caption[1] === 'string') {
                this.intro = caption[1];
            }
        }
        else {
            this.ui.format(this.span, caption);
        }
        
        if (choices) {
            // menu based switcher
            const popup = this.ui.createElement('text', this.node);
            this.text = this.ui.createElement('span', popup);
            this.ui.createElement('bar', popup);
            this.ui.bind(popup, () => {
                // open context menu
                const rect = popup.getBoundingClientRect();
                const menu = this.ui.create('popup');
                for (const [id, name] of choices) {
                    menu.pane.addOption(name, async () => {
                        if (this.confirm.has(id)) {
                            const [title, content] = this.confirm.get(id)!;
                            if (!await this.app.confirm(title ?? '确定将' + caption + '设为' + name + '？', {content})) {
                                return;
                            }
                        }
                        onclick(id);
                        menu.close();
                    })
                }
                menu.open({
                    x: (rect.left + rect.width) / this.app.zoom + 3,
                    y: rect.top / this.app.zoom - 3
                });
            });

            // save captions corresponding to option values
            this.choices = new Map(choices);
        }
        else {
            // boolean switcher
            const switcher = this.ui.createElement('switcher', this.node);
            const container = this.ui.createElement('switcher-container', switcher);
            this.ui.createElement('switcher-background', container);
            this.ui.createElement('switcher-button', switcher);
            this.ui.bind(switcher, async () => {
                const val = !this.node.classList.contains('on');
                if (this.confirm.has(val)) {
                    const [title, content] = this.confirm.get(val) as [string?, string?];
                    if (!await this.app.confirm(title ?? '确定' + (val ? '开启' : '关闭') + caption + '？', {content})) {
                        return;
                    }
                }
                onclick(val);
            });
        }
    }

    // assign value
    assign(value: boolean | string | number) {
        if (typeof value === 'boolean') {
            // boolean toggle
            this.node.classList[value ? 'add' : 'remove']('on');
        }
        else if (this.text && this.choices) {
            // menu based switcher
            this.ui.format(this.text, this.choices.get(value) ?? '');
        }
    }
}