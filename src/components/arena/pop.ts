import { Component, Gallery, Timer, Player } from '../../components';

/** Selectable items. */
export interface Select<T> {
    /** Items to choose from. */
    items: T[];

    /** Name of the function that checks if item can be selected. */
    filter?: string;

    /** Required number of selected items. */
    num: number | [number, number];
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

    /** Timer bar. */
    timer: Timer | null = null;

    /** All items.
     * [0]: element in gallery
     * [1]: element in tray
     * [2]: gallery that contains the item
     */
    items = new Map<string | number, [HTMLElement, HTMLElement, Gallery]>();

    /** Filters and expected number of selected items of galleries. */
    galleries = new Map<Gallery, [[number, number], string?]>();

    /** Container of clones of selected items. */
    tray!: HTMLElement;

    /** Confirm button. */
    ok!: HTMLElement;

    /** Click on selectable items. */
    click(id: string | number) {
        const [node, clone, gallery] = this.items.get(id)!;
        if (node.classList.contains('selected')) {
            node.classList.remove('selected');
            clone.remove();
            this.check();
        }
        else if (!node.classList.contains('defer')) {
            node.classList.add('selected');
            this.tray.appendChild(clone);
            this.check();
        }
    }

    addCaption(caption: string) {
        this.pane.addCaption(caption);
        this.height += 50;
    }

    addHero(select: string[] | Select<string>) {
        // determine gallery size
        const heros = Array.isArray(select) ? select : select.items;
        const width = parseInt(this.app.css.pop.width);
        const height = parseFloat(this.app.css.player.ratio) * width;
        const margin = parseInt(this.app.css.pop.margin);
        const currentHeight = this.height;

        let nrows: number;
        let ncols: number;

        if (heros.length <= 5) {
            // single-row gallery
            ncols = heros.length;
            nrows = 1;
            this.width = Math.max(this.width, heros.length * (width + margin) + margin * 4);
            this.height += height + margin * 2;
        }
        else {
            // double-row gallery
            ncols = 5;
            nrows = 2;
            this.width = Math.max(this.width, 5 * (width + margin) + margin * 4);
            this.height += height * 2 + margin * 3;

            if (heros.length > 10) {
                this.height += 12;
            }
        }

        // add gallery
        const gallery = this.pane.addGallery(nrows, ncols);
        gallery.node.style.height = `${this.height - currentHeight}px`;
        gallery.node.addEventListener('mousedown', e => e.stopPropagation());

        if (!Array.isArray(select)) {
            let num = select.num;
            if (typeof num === 'number') {
                num = [num, num];
            }
            this.galleries.set(gallery, [num, select.filter]);
        }

        // add hero entries
        for (const hero of heros) {
            gallery.add(() => {
                const player = this.ui.create('player');
                const [ext, name] = hero.split(':');
                player.data.heroImage = hero;
                player.data.heroName = this.accessExtension(ext, 'hero', name, 'name');
                const node = player.node;

                // bind context menu
                this.ui.bind(node, {oncontext: () => {
                    player.data.heroName = 'Right';
                }});

                // add to this.items
                if (!Array.isArray(select)) {
                    const clone = this.ui.createElement('widget');
                    const onclick = () => this.click(hero);
                    this.ui.setImage(clone, hero);
                    this.ui.bind(clone, onclick);
                    this.ui.bind(player.node, onclick);
                    this.items.set(hero, [player.node, clone, gallery])
                }
                return player.node;
            });
        }

        // render all items to fill this.items
        gallery.renderAll();
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

    /** Add tray of selected items. */
    addTray() {
        const height = parseInt(this.app.css.pop['tray-height']);
        const tray = this.tray = this.pane.add('bar');
        tray.classList.add('tray');
        tray.style.height = `${height}px`;
        this.height += height + 26;
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

    /** Filter selectable items. */
    check() {
        // get selected items
        const selections = new Map<Gallery, Set<string | number>>();
        for (const [, [, , gallery]] of this.items) {
            selections.set(gallery, new Set());
        }
        for (const [id, [item, , gallery]] of this.items) {
            if (item.classList.contains('selected')) {
                selections.get(gallery)!.add(id);
            }
        }

        // check if buttons can be selected
        for (const [id, [item, , gallery]] of this.items) {
            if (item.classList.contains('selected')) {
                continue;
            }
            const [num, filter] = this.galleries.get(gallery)!;
            const selected = selections.get(gallery)!;
            if (selected.size === num[1]) {
                item.classList.add('defer');
            }
            else if (filter) {
                //////
            }
        }
        
        // check if ok can be pressed
        let ok = true;
        for (const [gallery, [num]] of this.galleries) {
            const n = selections.get(gallery)!.size;
            if (n < num[0] || n > num[1]) {
                ok = false;
                break;
            }
        }
        this.ok.classList[ok ? 'remove' : 'add']('disabled');
    }

    $content(content: PopContent) {
        if (this.mine) {
            // add items
            let confirm: any = null;
            for (const [type, arg] of content as any) {
                if (type === 'confirm') {
                    confirm = arg;
                }
                else {
                    this['add' + type[0].toUpperCase() + type.slice(1)](arg);
                }
            }

            // tray of selected items
            if (this.items.size) {
                this.addTray();
            }

            // confirm buttons
            if (confirm) {
                this.addConfirm(confirm);
            }

            // update selectable items
            if (this.items.size) {
                this.check();
            }

            // update final size
            this.node.style.width = `${this.width}px`;
            this.node.style.height = `${this.height}px`;
            this.node.style.left = `calc(50% - ${this.width / 2}px)`;
            this.node.style.top = `calc(50% - ${this.height / 2}px)`;
            this.ui.bind(this.node, {oncontext: () => {
                this.ui.moveTo(this.node, {x: 0, y: 0});
            }});
            this.app.arena!.appZoom.node.appendChild(this.node);

            // animate fade in
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