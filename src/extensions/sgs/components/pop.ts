import type { Pop, Point } from '../../../components';

export function pop(T: typeof Pop) {
    return class Pop extends T {
        /** Items added manually. */
        addedItems = new Set<string | number>();

        /** Open popup to pick heros.
         * Note: if used, only 1 gallery is allowed in Pop and
         * filter function must not rely on worker (only takes 1 argument).
         */
        pick([e, packs]: [Point, string[]]) {
            const gallery = this.galleries.keys().next().value;
            const [, filter] = this.galleries.get(gallery)!;
            const func = filter ? this.app.accessExtension(filter) : null;
            const menu = this.ui.create('popup');
            const filterThis = {
                all: [],
                getHero: this.app.getHero,
                getCard: this.app.getCard,
                accessExtension: this.app.accessExtension
            } as any;

            for (const pack of packs) {
                const name = this.app.accessExtension(pack, 'heropack');
                for (const hero in this.app.accessExtension(pack, 'hero')) {
                    filterThis.all.push(name + ':' + hero);
                }

                menu.pane.addOption(name ?? pack, e => {
                    menu.close();

                    // create hero gallery
                    const collection = this.ui.create('collection');
                    collection.pop(e, pack, 'hero');
                    collection.gallery.renderAll();
                    
                    // check if hero is allowed
                    const check = () => {
                        filterThis.selected = Array.from(this.selected);
                        for (const [id, node] of collection.items) {
                            let disabled = this.items.has(id);
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
                    check();

                    // bind onclick
                    for (const [id, node] of collection.items) {
                        this.ui.bind(node, () => {
                            if (node.classList.contains('defer')) return;
                            const clone = this.ui.createElement('widget.avatar');
                            clone.dataset.shadow = 'blue';
                            const onclick = () => this.click(id);
                            this.ui.setImage(clone, id);
                            this.ui.bind(clone, onclick);
                            this.items.set(id, [this.ui.createElement('player'), clone, gallery]);
                            onclick();
                            if (this.check()) {
                                collection.close();
                            }
                            else {
                                check();
                            }
                        });
                    }
                });
            }
            menu.open(e);
        }

        /** Update pick button when checking. */
        check() {
            const ok = super.check();
            if (typeof ok === 'boolean') {
                this.buttons.get('pick')?.classList[!ok ? 'remove' : 'add']('disabled');
            }
            return ok;
        }
    }
}