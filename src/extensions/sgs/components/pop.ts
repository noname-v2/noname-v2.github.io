import type { Pop, Point, Collection } from '../../../components';

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

        /** Open a popup to pick heros. */
        pick([e, packs]: [Point, string[]]) {
            if (this.#restore()) {
                return;
            }
            const menu = this.ui.create('popup');
            for (const pack of packs) {
                // separate by packs to improve performance
                const name = this.app.accessExtension(pack, 'heropack');
                menu.pane.addOption(name ?? pack, e => {
                    // open hero gallery
                    menu.close();
                    if (!this.collections.has(pack)) {
                        this.#createCollection(pack);
                    }
                    this.collections.get(pack)!.pop(e);
                });
            }
            menu.open(e);
        }

        /** Save picked heros. */
        #save() {
            this.db.set(this.#id, Array.from(this.picked));
            this.buttons.get('callPick')!.dataset.fill = this.picked.size ? 'blue' : '';
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
                    this.tray.appendChild(clone);
                }
                this.updateTray(null, null, false);
                for (const id of picked) {
                    const clone = this.clones.get(id)!
                    const x = (clone as any)._x;
                    this.ui.animate(clone, {x: [x, x], opacity: [0, 1]});
                }
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
                this.ui.setImage(clone, id);
                let clicked = false;
                this.ui.bind(clone, () => {
                    if (clicked) {
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
            this.updateTray(null, this.clones.get(id)!, false);
            this.#save();
        }

        /** Create a hero collection of an extension. */
        #createCollection(pack: string) {
            const collection = this.ui.create('collection');
            collection.setup(pack, 'hero', (id, node) => {
                this.ui.bind(node, () => {
                    if (this.picked.has(id)) {
                        // unselect hero
                        this.#unpick(id);
                        node.classList.remove('defer');
                    }
                    else if (!node.classList.contains('defer')) {
                        // create clone of hero
                        this.#pick(id);
                        this.updateTray(null, this.clones.get(id)!, true);
                        this.#save();
                        node.classList.add('defer');
                    }
                });
            });
            this.collections.set(pack, collection);
            
            // check if hero is picked
            collection.onopen = () => {
                for (const [id, node] of collection.items) {
                    node.classList[this.picked.has(id) ? 'add' : 'remove']('defer');
                }
            };
        }
    }
}