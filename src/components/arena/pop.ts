import { Component, Gallery, Timer, Player } from '../../components';

/**  */
export interface Select<T> {
    /** Items to choose from. */
    items: T[];

    /** Check if item can be selected.
     * string: filter function
     * true: all selectable
     * false: ask worker each time
     */
    filter: string | boolean;

    /** Required number of selected items. */
    num: number | number;
}

/** Possible contents of pop sections. */
interface PopSectionContent {
    /** Caption text. */
    caption: string;

    /** Section text. */
    section: string;

    /** Body text. */
    text: string;

    /** Hero gallery. */
    hero: string[] | Select<string>;

    /** Card gallery. */
    card: string[];

    /** Virtual card gallery. */
    vcard: [string, string, number, ...string[]];

    /** Skill gallery. */
    skill: string[];

    /** OK and optionally cancel button. */
    confirm: PopConfirm;

    /** Multi-row gallery that allow sorting.
     * [0]: type of gallery item
     * [1]: allow reordering items
     * [2]: allow exchanging items between rows
     * ...: row contents
     */
    sort: ['hero' | 'card', boolean, ...string[][]]
}

/** Type of confirm bar content. */
export type PopConfirm = ('ok' | 'cancel' | [string, string, string?])[];

/** Content of a pop section. */
export type PopSection<T extends keyof PopSectionContent = keyof PopSectionContent> = [T, PopSectionContent[T]];

/** Full content of a pop. */
export type PopContent = PopSection[] | PopSection;

export class Pop extends Component {
    /** Height based on content height. */
    height = 24;
    
    /** Width based on content width. */
    width = 0;

    /** Content container. */
    pane = this.ui.create('pane', this.node);

    /** Galleries in this.pane. */
    galleries = new Set<Gallery>();

    /** Timer bar. */
    timer: Timer | null = null;

    /** Confirm button. */
    ok?: HTMLElement;

    get selected() {
        return [];
    }

    addCaption(caption: string) {
        this.pane.addCaption(caption);
        this.height += 50;
    }

    addHero(select: string[] | Select<string>) {
        const heros = Array.isArray(select) ? select : select.items;
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

        let tray: Gallery;
        const gallery = this.pane.addGallery(nrows, ncols);
        const trayItems: HTMLElement[] = [];
        const selected = new Map<HTMLElement, HTMLElement>();
        this.galleries.add(gallery);
        gallery.node.style.height = `${this.height - currentHeight}px`;
        gallery.node.addEventListener('mousedown', e => e.stopPropagation());
        for (const hero of heros) {
            gallery.add(() => {
                const player = this.ui.create('player');
                const [ext, name] = hero.split(':');
                player.data.heroImage = hero;
                player.data.heroName = this.accessExtension(ext, 'hero', name, 'name');
                this.ui.bind(player.node, {
                    onclick: () => {
                        const unselect = () => {
                            const widget = selected.get(player.node)!;
                            (widget.parentNode as HTMLElement).classList.remove('filled');
                            widget.remove();
                            selected.delete(player.node);
                            player.node.classList.remove('selected');
                        };
                        if (selected.has(player.node)) {
                            unselect();
                        }
                        else {
                            for (const item of trayItems) {
                                if (!item.classList.contains('filled')) {
                                    const widget = this.ui.createElement('widget', item);
                                    this.ui.setImage(widget, hero);
                                    item.classList.add('filled');
                                    selected.set(player.node, widget);
                                    player.node.classList.add('selected');
                                    this.ui.bind(widget, unselect);
                                    const clone = widget.cloneNode(true);
                                    const rect1 = player.node.getBoundingClientRect();
                                    const rect2 = item.getBoundingClientRect();
                                    this.ui.animate(clone as HTMLElement, {
                                        x: [rect1.x - rect2.x, 0],
                                        y: [rect1.y - rect2.y, 0],
                                        opacity: [0, 1]
                                    });
                                    break;
                                }
                            }
                        }
                    },
                    oncontext: e => {
                        player.data.heroName = 'Right';
                    }
                });
                return player.node;
            });
        }

        if (!Array.isArray(select)) {
            const width = parseInt(this.app.css.pop['tray-width']);
            const margin = parseInt(this.app.css.pop['tray-margin']);
            const n = Array.isArray(select.num) ? select.num[1] : select.num;
            const ncols = Math.min(n, Math.floor((this.width - margin * 2) / (width + margin)));
            tray = this.pane.addGallery(1, ncols);
            tray.node.classList.add('tray');
            this.height += width;
            
            if (n > ncols) {
                this.height += 36;
                tray.node.style.height = `${width + 24}px`;
                tray.node.style.width = '100%';
            }
            else {
                this.height += 24;
                tray.node.style.height = `${width + 12}px`;
                const trayWidth = (width + margin) * ncols + margin * 2;
                tray.node.style.width = `${trayWidth}px`;
                tray.node.style.left = `calc(50% - ${trayWidth / 2}px)`;
            }
            
            for (let i = 0; i < n; i++) {
                tray.add((item) => {
                    this.ui.createElement('container', item);
                    trayItems.push(item);
                });
            }

            tray.renderAll();
        }
    }

    addConfirm(content: PopConfirm) {
        this.height += 50;
        this.width = Math.max(this.width, 230);

        const bar = this.pane.add('bar');

        for (const item of content) {
            if (item === 'ok') {
                const ok = this.ok = this.ui.createElement('widget.button', bar);
                ok.dataset.fill = 'red';
                ok.innerHTML = '确定';
                this.ui.bind(ok, () => {
                    this.respond(this.selected);
                    this.remove();
                });
            }
            else if (item === 'cancel') {
                const cancel = this.ui.createElement('widget.button', bar);
                cancel.innerHTML = '取消';
                this.ui.bind(cancel, () => {
                    this.respond(false);
                    this.remove();
                });
            }
            else {
                const button = this.ui.createElement('widget.button', bar);
                const [id, text, color] = item;
                button.innerHTML = text;
                if (color) {
                    button.dataset.fill = color;
                }
                this.ui.bind(button, () => {
                    this.yield(id);
                });
            }
        }
    }

    /** Remove with fade out animation. */
    remove() {
        if (this.removing) {
            return;
        }
        
        super.remove(this.ui.animate(this.node, {
            scale: [1, 'var(--app-zoom-scale)'],
            opacity: [1, 0]
        }));
        this.app.arena!.pops.delete(this);
        this.checkPops();

        // remove all timers of the same player with the same start time
        if (this.mine && this.timer) {
            for (const id of this.app.arena!.data.players) {
                const player = this.getComponent(id) as (Player | undefined);
                if (player?.mine && player.timer?.starttime === this.timer.starttime) {
                    player.timer.node.remove();
                }
            }
        }
    }

    /** Update arena classes. */
    checkPops() {
        const arena = this.app.arena!;
        arena.arenaZoom.node.classList[arena.pops.size ? 'add' : 'remove']('blurred');
    }

    /** Update move range. */
    resize() {
        const dx = (this.app.width - this.width) / 2;
        const dy = (this.app.height - this.height) / 2
        this.ui.bind(this.node, {
            movable: {x: [-dx, dx], y: [-dy, dy]}
        });
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
            this.ui.bind(this.node, {oncontext: () => {
                this.ui.moveTo(this.node, {x: 0, y: 0});
            }});
            this.app.arena!.appZoom.node.appendChild(this.node);

            for (const gallery of this.galleries) {
                gallery.checkPage();
            }

            this.app.arena!.pops.add(this);
            this.checkPops();
            this.ui.animate(this.node, {
                scale: ['var(--app-zoom-scale)', 1],
                opacity: [0, 1]
            }).onfinish = () => this.resize();
            this.listen('resize');
        }
        else {
            setTimeout(() => this.checkPops())
        }
    }

    $timer(config?: [number, number]) {
        if (config) {
            setTimeout(() => {
                const timer = this.ui.create('timer', this.node);
                timer.width = this.width;
                timer.start(config, this, false);
                this.app.arena!.node.classList.add('pop-timer');
            });
        }
        else {
            this.timer?.remove();
        }
    }
}