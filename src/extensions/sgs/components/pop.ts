import type { Pop, Point, Collection } from '../../../components';

export function pop(T: typeof Pop) {
    return class Pop extends T {
        /** Items added manually. */
        addedItems = new Set<string | number>();

        /** Selected by pick. */
        picked = new Set<string>();

        /** Clones from pick. */
        clones = new Map<string, HTMLElement>();

        /** Cache of created galleries. */
        collections = new Map<string, Collection>();

        /** All items. */
        all!: string[];

        /** Open a popup to pick heros. Note, if enabled:
         * 1. multiple galleries in a single Pop is no longer allowed.
         * 2. filter function can must be client-compatible (takes only 1 argument).
         */
        pick([e, packs]: [Point, string[]]) {
            // get all available items
            if (!this.all) {
                this.all = [];
                for (const pack of packs) {
                    const name = this.app.accessExtension(pack, 'heropack');
                    for (const hero in this.app.accessExtension(pack, 'hero')) {
                        this.all.push(name + ':' + hero);
                    }
                }
            }

            const menu = this.ui.create('popup');
            for (const pack of packs) {
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

        /** Create a collection. */
        #createCollection(pack: string) {
            const gallery = this.galleries.keys().next().value;
            const [num, filter] = this.galleries.get(gallery)!;
            const func = filter ? this.app.accessExtension(filter) : null;
            const collection = this.ui.create('collection');
            const filterThis = {
                all: this.all,
                getHero: this.app.getHero,
                getCard: this.app.getCard,
                accessExtension: this.app.accessExtension
            } as any;

            collection.setup(pack, 'hero');
            collection.gallery.renderAll();
            this.collections.set(pack, collection);
            
            // check if hero is allowed
            const check = () => {
                filterThis.selected = Array.from(this.picked);
                for (const [id, node] of collection.items) {
                    let disabled = this.picked.has(id);
                    if (!disabled) {
                        try {
                            if (func && !func.call(filterThis, id)) {
                                disabled = true;
                            }
                        }
                        catch {}
                    }
                    node.classList[disabled ? 'add' : 'remove']('defer');
                }
            }
            collection.onopen = check;

            // bind onclick
            for (const [id, node] of collection.items) {
                this.ui.bind(node, () => {
                    if (this.picked.has(id)) {
                        this.picked.delete(id);
                        this.buttons.get('pick')?.classList.remove('disabled');
                        this.updateTray(null, this.clones.get(id)!, false);
                        check();
                    }
                    else if (!node.classList.contains('defer')) {
                        if (!this.clones.has(id)) {
                            const clone = this.ui.createElement('widget.avatar');
                            clone.dataset.shadow = 'blue';
                            this.ui.setImage(clone, id);
                            this.ui.bind(clone, () => {
                                this.picked.delete(id);
                                this.buttons.get('pick')?.classList.remove('disabled');
                                this.updateTray(null, clone, false);
                            });
                            this.clones.set(id, clone);
                        }
                        this.picked.add(id);
                        this.updateTray(null, this.clones.get(id)!, true);
                        if (this.picked.size === num[1]) {
                            this.buttons.get('pick')?.classList.add('disabled');
                            collection.close();
                        }
                        else {
                            check();
                        }
                    }
                });
            }
        }
    }
}