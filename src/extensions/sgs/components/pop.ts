import type { Pop, Point, Collection } from '../../../components';
import type { Selected } from '../types';

export function pop(T: typeof Pop) {
    return class Pop extends T {
        /** Selected by this.pick(). */
        picked = new Set<string>();

        /** Item clones created by this.pick(). */
        clones = new Map<string, HTMLElement>();

        /** Cache of created collections. */
        collections = new Map<string, Collection>();

        /** Restored picked heros from db. */
        #restored = false;

        /** ID in db for saving. */
        get #id() {
            const arena = this.app.arena!;
            return arena.data.mode + ':' + (arena.data.peers ? 'online_picked' : 'picked');
        }

        /** Include picked items. */
        ok() {
            if (this.picked.size) {
                this.respond([this.selected, this.picked]);
            }
            else {
                super.ok();
            }
        }

        /** Include picked items. */
        getSelected() {
            // original selected items
            const selected: Selected = {};
            Object.assign(selected, super.getSelected());

            // add picked items
            const picked = Array.from(this.picked);
            picked.sort((a, b) => {
                const idx = (id: string) => this.tray.items.get(this.clones.get(id)!) ?? -1;
                return idx(b) - idx(a);
            });
            selected.picked = picked;

            return selected;
        }

        /** Enable pick by default. */
        addConfirm(confirm: any) {
            super.addConfirm(confirm);
            if (this.app.connected && this.buttons.get('callPick')) {
                this.tray.ready.then(() => this.#restore());
            }
        }

        /** Enable or disable pick. */
        togglePick() {
            const button = this.buttons.get('callPick')!;
            if (button.dataset.fill) {
                this.#clear();
            }
            else {
                this.#restore();
            }
        }

        /** Open a popup to pick heros. */
        pick([e, packs]: [Point, string[]]) {
            if (!this.mine || this.#restore()) {
                return;
            }
            const menu = this.ui.create('popup');
            for (const pack of packs) {
                // separate by packs to improve performance
                const name = this.app.accessExtension(pack, 'heropack');
                menu.pane.addOption(name ?? pack, () => {
                    // open hero gallery
                    menu.close();
                    if (!this.collections.has(pack)) {
                        this.#createCollection(pack);
                    }
                    this.collections.get(pack)!.pop();
                });
            }

            // cancel this.#restore
            if (this.picked.size) {
                menu.pane.addOption('取消', () => {
                    this.#clear();
                    menu.close();
                });
            }

            menu.open(e);
        }

        /** Save picked heros. */
        #save() {
            this.db.set(this.#id, Array.from(this.picked));
            this.buttons.get('callPick')!.dataset.fill = this.picked.size ? 'blue' : '';
        }

        /** Clear picked items. */
        #clear() {
            for (const id of this.picked) {
                this.tray.deleteSilent(this.clones.get(id)!);
            }
            this.tray.align();
            this.picked.clear();
            this.buttons.get('callPick')!.dataset.fill = '';
            this.#restored = false;
        }

        /** Restore from saved heros. */
        #restore() {
            if (this.#restored) {
                return false;
            }
            this.#restored = true;
            const picked = this.db.get(this.#id) ?? [];
            if (picked.length) {
                for (const id of picked) {
                    this.#pick(id);
                    const clone = this.clones.get(id)!;
                    this.tray.addSilent(clone);
                }
                this.tray.align();
                this.buttons.get('callPick')!.dataset.fill = 'blue';
                return true;
            }
            else {
                return false;
            }
        }

        /** Pick an item. */
        #pick(id: string) {
            if (!this.clones.has(id)) {
                const clone = this.ui.createElement('widget.avatar');
                clone.dataset.shadow = 'blue';
                this.app.bindHero(clone, id);
                this.ui.setImage(clone, id);
                let clicked = false;
                this.ui.bind(clone, () => {
                    if (clicked || this.app.connected) {
                        return;
                    }
                    clicked = true;
                    setTimeout(() => clicked = false, 500);
                    this.#unpick(id);
                });
                this.clones.set(id, clone);
            }
            // select hero
            this.picked.add(id);
        }

        /** Unpick an item. */
        #unpick(id: string) {
            this.picked.delete(id);
            this.tray.delete(this.clones.get(id)!);
            this.#save();
        }

        /** Create a hero collection of an extension. */
        #createCollection(pack: string) {
            const collection = this.ui.create('collection');
            collection.nrows = 3;
            collection.ncols = 7;
            collection.setup([pack], 'hero', (id, node) => {
                if (this.picked.has(id)) {
                    node.classList.add('selected');
                }
                this.ui.bind(node, () => {
                    if (this.picked.has(id)) {
                        // unselect hero
                        this.#unpick(id);
                        node.classList.remove('selected');
                    }
                    else if (!node.classList.contains('selected')) {
                        // create clone of hero
                        this.#pick(id);
                        this.tray.add(this.clones.get(id)!);
                        this.#save();
                        node.classList.add('selected');
                    }
                });
            });
            this.collections.set(pack, collection);
            
            // check if hero is picked
            collection.onopen = () => {
                for (const [id, node] of collection.items) {
                    node.classList[this.picked.has(id) ? 'add' : 'remove']('selected');
                }
            };
        }
    }
}