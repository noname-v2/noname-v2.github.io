import { Component, Gallery } from '../../components';

/** Possible contents of pop sections. */
interface PopSectionContent {
    /** Caption text. */
    caption: string;

    /** Section text. */
    section: string;

    /** Body text. */
    text: string;

    /** Hero gallery. */
    hero: string[];

    /** Card gallery. */
    card: string[];

    /** Virtual card gallery. */
    vcard: [string, string, number, ...string[]];

    /** Skill gallery. */
    skill: string[];

    /** OK and optionally cancel button. */
    confirm: boolean;

    /** Multi-row gallery that allow sorting.
     * [0]: type of gallery item
     * [1]: allow reordering items
     * [2]: allow exchanging items between rows
     * ...: row contents
     */
    sort: ['hero' | 'card', boolean, ...string[][]]
}

/** Content of a pop section. */
export type PopSection<T extends keyof PopSectionContent = keyof PopSectionContent> = [T, PopSectionContent[T]];

/** Full content of a pop. */
export type PopContent = PopSection[] | PopSection;

export class Pop extends Component {
    height = 24;
    width = 0;
    pane = this.ui.create('pane', this.node);
    galleries = new Set<Gallery>();

    get selected() {
        return [];
    }

    addCaption(caption: string) {
        this.pane.addCaption(caption);
        this.height += 50;
    }

    addHero(heros: string[]) {
        const width = parseInt(this.app.css.pop.width);
        const height = parseFloat(this.app.css.player.ratio) * width;
        const margin = parseInt(this.app.css.pop.margin);
        const currentHeight = this.height;

        let nrows: number;
        let ncols: number;

        if (heros.length <= 5) {
            ncols = heros.length;
            nrows = 1;
            this.width = Math.max(this.width, heros.length * (width + margin) + margin * 4);
            this.height += height + margin * 2;
        }
        else {
            ncols = 5;
            nrows = 2;
            this.width = Math.max(this.width, 5 * (width + margin) + margin * 4);
            this.height += height * 2 + margin * 3;

            if (heros.length > 10) {
                this.height += 12;
            }
        }

        const gallery = this.pane.addGallery(nrows, ncols);
        gallery.node.style.height = `${this.height - currentHeight}px`;
        for (const hero of heros) {
            gallery.add(() => {
                const player = this.ui.create('player');
                const [ext, name] = hero.split(':');
                player.data.heroImage = hero;
                player.data.heroName = this.accessExtension(ext, 'hero', name, 'name');
                return player.node;
            });
        }
        this.galleries.add(gallery);
    }

    addConfirm(cancel: boolean) {
        this.height += 50;
        this.width = Math.max(this.width, 230);

        const bar = this.pane.add('bar');
        const ok = this.ui.createElement('widget.button', bar);
        ok.dataset.fill = 'red';
        ok.innerHTML = '确定';
        this.ui.bind(ok, () => {
            this.respond(this.selected);
            this.remove();
        });
        
        if (cancel) {
            const cancel = this.ui.createElement('widget.button', bar);
            cancel.innerHTML = '取消';
            this.ui.bind(cancel, () => {
                this.respond(false);
                this.remove();
            });
        }
    }

    /** Remove with fade out animation. */
    remove() {
        super.remove(this.app.arena!.removePop(this));
    }

    $content(content: PopContent) {
        if (this.mine) {
            for (const [type, arg] of content as any) {
                this['add' + type[0].toUpperCase() + type.slice(1)](arg);
            }
            this.node.style.width = `${this.width}px`;
            this.node.style.height = `${this.height}px`;
            this.node.style.left = `calc(50% - ${this.width / 2}px)`;
            this.node.style.top = `calc(50% - ${this.height / 2}px)`;
            this.app.arena!.appZoom.node.appendChild(this.node);

            for (const gallery of this.galleries) {
                gallery.checkPage();
            }

            this.app.arena!.addPop(this);
        }
    }
}