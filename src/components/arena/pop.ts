import { Component, Gallery, Timer, Player, Point } from '../../components';
import type { Select, FilterThis } from '../../types';

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

    /** Map of button IDs -> button elements. */
    buttons = new Map<string, HTMLElement>();

    /** Selected items. */
    selected = new Set<string | number>();

    /** Filters and expected number of selected items of galleries. */
    galleries = new Map<Gallery, [[number, number], string?]>();

    /** Container of clones of selected items. */
    tray!: HTMLElement;

    /** Operation blocked by animation. */
    #blocked: HTMLElement | null = null;

    /** Awaiting filter results from worker. */
    #pending: boolean = false;

    /** Click on selectable items. */
    click(id: string | number) {
        if (this.#blocked || this.#pending) return;
        const [node] = this.items.get(id)!;
        if (this.selected.has(id)) {
            this.selected.delete(id);
            node.classList.remove('selected');
            this.#updateTray(id, false);
            this.check();
        }
        else if (!node.classList.contains('defer')) {
            this.selected.add(id);
            node.classList.add('selected');
            this.#updateTray(id, true);
            this.check();
        }
    }

    addCaption(caption: string) {
        this.pane.addCaption(caption);
        this.height += 50;
    }

    addHero(select: string[] | Select<string>) {
        const heros = Array.isArray(select) ? select : select.items;
        const [gallery, width, height] = this.pane.addPopGallery(heros.length);
        this.height += height;
        this.width = Math.max(this.width, width);

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
                player.setHero(hero);

                // bind context menu
                this.ui.bind(player.node, {oncontext: () => {
                    player.data.heroName = 'Right';
                }});

                // add to this.items
                if (!Array.isArray(select)) {
                    const clone = this.ui.createElement('widget.avatar');
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
                const ok = this.ui.createElement('widget.button', bar);
                this.buttons.set('ok', ok);
                ok.dataset.fill = 'red';
                ok.innerHTML = '确定';
                this.ui.bind(ok, () => {
                    this.respond(this.selected);
                    this.remove();
                });
            }
            else if (item === 'cancel') {
                const cancel = this.ui.createElement('widget.button', bar);
                this.buttons.set('cancel', cancel);
                cancel.innerHTML = '取消';
                this.ui.bind(cancel, () => {
                    this.respond(false);
                    this.remove();
                });
            }
            else {
                const button = this.ui.createElement('widget.button', bar);
                const [id, text, color] = item;
                this.buttons.set(id, button);
                button.innerHTML = text;
                if (color) {
                    button.dataset.fill = color;
                }
                this.ui.bind(button, e => {
                    this.yield([id, {x: e.x, y: e.y}]);
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
        if (this.#pending) {
            return;
        }

        // get selected items
        const selections = new Map<Gallery, (string | number)[]>();
        for (const [, [, , gallery]] of this.items) {
            if (!selections.has(gallery)) {
                selections.set(gallery, []);
            }
        }
        for (const id of this.selected) {
            const [, , gallery] = this.items.get(id)!;
            selections.get(gallery)!.push(id);
        }

        // get all items of a given section
        const all = new Map<Gallery, (string | number)[]>();
        for (const [id, [, , gallery]] of this.items) {
            if (!all.has(gallery)) {
                all.set(gallery, []);
            }
            all.get(gallery)!.push(id);
        }

        // check if buttons can be selected
        for (const [id, [item, , gallery]] of this.items) {
            if (this.selected.has(id)) {
                continue;
            }
            const [num, filter] = this.galleries.get(gallery)!;
            const selected = selections.get(gallery)!;
            if (selected.length === num[1]) {
                item.classList.add('defer');
            }
            else if (filter) {
                let ask = false;
                const func = this.app.accessExtension(filter);
                if (!func || func.length > 1) {
                    ask = true;
                }
                else {
                    try {
                        const filterThis: FilterThis<any> = {
                            selected: selected,
                            all: all.get(gallery)!,
                            getHero: this.app.getHero,
                            getCard: this.app.getCard,
                            accessExtension: this.app.accessExtension
                        }
                        item.classList[func.call(filterThis, id) ? 'remove' : 'add']('defer');
                    }
                    catch {
                        ask = true;
                    }
                }
                if (ask) {
                    this.#pending = true;
                    this.yield(Array.from(selections.values()));
                    this.buttons.get('ok')?.classList.add('disabled');
                    console.log('asking...');
                    return;
                }
            }
            else {
                item.classList.remove('defer');
            }
        }
        
        // check if ok can be pressed
        let ok = true;
        for (const [gallery, [num]] of this.galleries) {
            const n = selections.get(gallery)!.length;
            if (n < num[0] || n > num[1]) {
                ok = false;
                break;
            }
        }
        this.buttons.get('ok')?.classList[ok ? 'remove' : 'add']('disabled');
        
        return ok;
    }

    /** Update selectable items by worker. */
    setSelectable(selectable: (string | number)[]) {
        if (this.#pending) {
            for (const [id, [item]] of this.items) {
                item.classList[selectable.includes(id) ? 'remove' : 'add']('defer');
            }
            this.#pending = false;
        }
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

    /** Update tray item locations. */
    #updateTray(id: string | number, add: boolean) {
        const [item, clone, gallery] = this.items.get(id)!;
        const d = parseInt(this.app.css.pop['tray-height']) - 8;
        const margin = parseInt(this.app.css.pop['tray-margin']);
        const width = this.tray.clientWidth;
        const clones = [];
        for (const node of Array.from(this.tray.childNodes)) {
            if (node === clone) {
                continue;
            }
            clones.push(node as HTMLElement);
        }
        if (add) {
            clones.push(clone);
        }

        // determine spacing
        const n = clones.length;
        let spacing: number;
        if ((width - margin) / (d + margin) > n) {
            // use margin as spacing
            spacing = margin;
        }
        else if ((width - 4) / (d + 4) > n) {
            // spaced evenly
            spacing = (width - n * d) / (n + 1);
        }
        else {
            // leave 4px for left and right
            spacing = (width - 8 - d) / (n - 1) - d;
        }

        // determine left most location
        const length = d * n + spacing * (n - 1);
        const left = (width - length) / 2;

        // align items
        for (let i = 0; i < clones.length; i++) {
            const x = left + i * (d + spacing);
            clones[i].style.transform = `translateX(${x}px)`;
            (clones[i] as any)._x = x;
        }

        // add or remove diff
        if (add) {
            this.tray.appendChild(clone);
        }

        const rect1 = item.parentNode ? item.getBoundingClientRect() : {} as any;
        const rect2 = clone.getBoundingClientRect();
        let dx = (rect1.x + rect1.width / 2 - rect2.width / 2 - rect2.x) / this.app.zoom;
        let dy = (rect1.y + rect1.height / 2 - rect2.height / 2 - rect2.y) / this.app.zoom;
        let scale: string | number = 1.5;
        const x = (clone as any)._x;
        
        this.#blocked = clone;
        const unblock = () => {
            if (this.#blocked === clone) {
                this.#blocked = null;
            }
        }
        setTimeout(unblock, 500);

        if (add) {
            if (!item.parentNode) {
                // item added from elsewhere (e.g. freeChoose)
                dx = 0;
                dy = 0;
                scale = 'var(--app-zoom-scale)';
            }
            this.ui.animate(clone, {
                x: [x + dx, x], y: [dy, 0], scale: [scale, 1], opacity: [0, 1]
            }).onfinish = unblock;
        }
        else {
            let zoom = false;
            if (item.parentNode) {
                const page = item.parentNode!.parentNode!.parentNode as HTMLElement;
                const indicator = page.parentNode!.nextSibling as HTMLElement;
                const idx = Array.from(page.parentNode!.childNodes).indexOf(page);
                const idx2 = Array.from(indicator.childNodes).indexOf(indicator.querySelector('.current')!);
                
                // skip translate animation if item is not in current gallery page
                if (idx !== idx2) {
                    zoom = true;
                }
            }
            else {
                // item added from elsewhere (e.g. freeChoose)
                zoom = true;
            }
            
            if (zoom) {
                dx = 0;
                dy = 0;
                scale = 'var(--app-zoom-scale)';
            }

            this.ui.animate(clone, {
                x: [x, x + dx], y: [0, dy], scale: [1, scale], opacity: [1, 0]
            }).onfinish = () => { clone.remove(); unblock() };
        }
    }
}