import type { Pop, Point, Collection } from '../../../components';

export function pop(T: typeof Pop) {
    return class Pop extends T {
        /** Selected by this.pick(). */
        picked = new Set<string>();

        /** Item clones created by this.pick(). */
        clones = new Map<string, HTMLElement>();

        /** Cache of created collections. */
        collections = new Map<string, Collection>();

        /** Open a popup to pick heros. */
        pick([e, packs]: [Point, string[]]) {
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

        /** Create a hero collection of an extension. */
        #createCollection(pack: string) {
            const collection = this.ui.create('collection');
            collection.setup(pack, 'hero', (id, node) => {
                this.ui.bind(node, () => {
                    if (this.picked.has(id)) {
                        // unselect hero
                        this.picked.delete(id);
                        this.updateTray(null, this.clones.get(id)!, false);
                        node.classList.remove('defer');
                    }
                    else if (!node.classList.contains('defer')) {
                        // create clone of hero
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
                                this.picked.delete(id);
                                this.updateTray(null, clone, false);
                            });
                            this.clones.set(id, clone);
                        }
                        // select hero
                        this.picked.add(id);
                        this.updateTray(null, this.clones.get(id)!, true);
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