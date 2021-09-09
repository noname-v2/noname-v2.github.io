import { AnimationOptions, Gallery, Timer, Player, Tray } from '../../components';
import { Popup } from '../popup';
import type { Select, Selected, Dict } from '../../types';

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
    card: string[] | Select<number>;

    /** Virtual card gallery. */
    vcard: [string, string, number, ...string[]] | Select<string>;

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
export type PopContent = PopSection[];

export class Pop extends Popup {
    /** Height based on content height. */
    height = 24;
    
    /** Width based on content width. */
    width = 0;

    /** Timer bar. */
    timer: Timer | null = null;

    /** Data of all selectable items.
     * [0]: Section name.
     * [1]: Element in gallery.
     * [2]: Element in tray.
     */
    entries = new Map<string | number, [string, HTMLElement, HTMLElement]>();

    /** Selected items in all sections. */
    selected: Selected = {};

    /** All selectable items. */
    items: Selected = {};

    /** Section data.
     * [0]: Gallery of the section.
     * [1]: Filter function of the section.
     */
    galleries: Dict<[Gallery, (item: string | number) => boolean, Select]> = {};

    /** Map of button IDs -> button elements. */
    buttons = new Map<string, HTMLElement>();

    /** Container of clones of selected items. */
    tray!: Tray;

    /** Awaiting filter results from worker. */
    #pending: boolean = false;

    /** Click on selectable items. */
    click(id: string | number) {
        if (this.#pending) return;
        const [section, item, clone] = this.entries.get(id)!;
        const [gallery] = this.galleries[section];
        const selected = this.selected[section];

        if (selected.includes(id)) {
            selected.splice(selected.indexOf(id), 1);
            item.classList.remove('selected');
            if (gallery.currentPage?.contains(item)) {
                this.tray.delete(clone, item);
            }
            else {
                this.tray.delete(clone);
            }
            this.check();
        }
        else if (!item.classList.contains('defer')) {
            selected.push(id);
            item.classList.add('selected');
            this.tray.add(clone, item, undefined, true);
            this.check();
        }
    }

    addCaption(caption: string) {
        this.pane.addCaption(caption);
        this.height += 50;
    }

    addHero(sel: string[] | Select<string>) {
        const heros = Array.isArray(sel) ? sel : sel.items;
        const [gallery, width, height] = this.pane.addPopGallery(heros.length);
        this.height += height;
        this.width = Math.max(this.width, width);

        // avoid conflict with move operation
        gallery.node.addEventListener('touchstart', e => e.stopPropagation(), {passive: false});

        if (!Array.isArray(sel)) {
            const selected: string[] = [];
            this.items.hero = sel.items;
            this.selected.hero = selected;
            const filter = this.app.createFilter('hero', sel, this.selected, this.items);
            this.galleries.hero = [gallery, filter, sel];
        }

        // add hero entries
        for (const hero of heros) {
            gallery.add(() => {
                const player = this.ui.create('player');
                player.initHero(hero);

                // bind context menu
                this.app.bindHero(player.node, hero);

                // add to this.entries
                if (!Array.isArray(sel)) {
                    const clone = this.ui.createElement('widget.avatar');
                    const onclick = () => this.click(hero);
                    this.ui.setImage(clone, hero);
                    this.ui.bind(clone, onclick);
                    this.ui.bind(player.node, onclick);
                    this.app.bindHero(clone, hero);
                    this.entries.set(hero, ['hero', player.node, clone])
                }
                return player.node;
            });
        }

        // render all items to fill this.entries
        gallery.renderAll();
    }

    /** Sort selected items by tray order. */
    sort() {
        for (const section in this.selected) {
            this.selected[section].sort((a, b) => this.#sort(a, b));
        }
    }

    /** Get selected items with order. */
    getSelected(): Selected {
        this.sort();
        return this.selected;
    }

    /** Add buttons in bottom bar. */
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
                    this.respond(this.getSelected());
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
                // custom operation that is processed by worker
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
        this.tray = this.pane.addTray('round');
        this.height += height + 26;
    }

    /** Remove with fade out animation. */
    remove() {
        if (this.removing) {
            return;
        }

        if (this.mine) {
            const config: AnimationOptions = {
                scale: [1, 'var(--app-zoom-scale)'],
                opacity: [1, 0]
            }
            const x = this.ui.getX(this.node);
            const y = this.ui.getY(this.node);
    
            if (x) {
                config.x = [x, x];
            }
    
            if (y) {
                config.y = [y, y];
            }

            super.remove(this.ui.animate(this.node, config));
            this.onclose!();
    
            // remove all timers of the same player with the same start time
            if (this.timer) {
                for (const id of this.app.arena!.data.players) {
                    const player = this.getComponent(id) as (Player | undefined);
                    if (player?.mine && player.timer?.starttime === this.timer.starttime) {
                        player.timer.node.remove();
                    }
                }
            }
        }
        else {
            super.remove();
        }
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

        // check if buttons can be selected
        let ok = true;
        this.sort();
        for (const section in this.selected) {
            const all = this.items[section];
            const selected = this.selected[section];
            const [, filter, sel] = this.galleries[section];
            for (const id of all) {
                if (!selected.includes(id)) {
                    const [, item] = this.entries.get(id)!;
                    try {
                        item.classList[filter(id) ? 'remove' : 'add']('defer');
                    }
                    catch {
                        this.#pending = true;
                        this.yield(this.selected);
                        this.buttons.get('ok')?.classList.add('disabled');
                        console.log('asking...');
                        return;
                    }
                }
            }

            const num = Array.isArray(sel.num) ? sel.num : [sel.num, sel.num];
            if (selected.length < num[0] || selected.length > num[1]) {
                ok = false;
            }
        }

        this.buttons.get('ok')?.classList[ok ? 'remove' : 'add']('disabled');
        return ok;
    }

    /** Update selectable items by worker. */
    setSelectable(selectable: (string | number)[]) {
        if (this.#pending) {
            for (const [id, [, item]] of this.entries) {
                if (!item.classList.contains('selected')) {
                    item.classList[selectable.includes(id) ? 'remove' : 'add']('defer');
                }
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
            if (this.entries.size) {
                this.addTray();
            }

            // confirm buttons
            if (confirm) {
                this.addConfirm(confirm);
            }

            // update selectable items
            if (this.entries.size) {
                this.check();
            }

            // update final size
            this.node.style.width = `${this.width}px`;
            this.node.style.height = `${this.height}px`;
            this.node.style.left = `calc(50% - ${this.width / 2}px)`;
            this.node.style.top = `calc(50% - ${this.height / 2}px)`;
            this.ui.bind(this.pane.node, {oncontext: () => {
                this.ui.moveTo(this.node, {x: 0, y: 0});
            }});
            this.app.arena!.appZoom.node.appendChild(this.node);

            // animate fade in
            this.app.arena!.popup(this);
            setTimeout(() => this.resize(), 500);
            this.listen('resize');
        }
        else if (!this.app.arena!.popups.size) {
            this.app.arena!.arenaZoom.node.classList.remove('blurred');
        }
    }

    $timer(config?: [number, number]) {
        if (config) {
            setTimeout(() => {
                const timer = this.ui.create('timer', this.pane.node);
                timer.width = this.width;
                timer.start(config, this, false);
                this.app.arena!.node.classList.add('pop-timer');
            });
        }
        else {
            this.timer?.remove();
        }
    }

    /** Sort by order in the tray. */
    #sort(a: string | number, b: string | number) {
        const idx = (id: string | number) => this.tray.items.get(this.entries.get(id)![1]) ?? -1;
        return idx(b) - idx(a);
    }
}