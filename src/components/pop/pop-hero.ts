import { Pop } from './pop';

export class PopHero extends Pop {
    addItems() {
        const heros = this.player.data.select.items as string[];
        const [gallery, width, height] = this.pane.addPopGallery(heros.length);
        this.height += height;
        this.width = Math.max(this.width, width);

        // avoid conflict with move operation
        gallery.node.addEventListener('touchstart', e => e.stopPropagation(), {passive: false});

        // add hero entries
        for (const hero of heros) {
            gallery.add(() => {
                // item in gallery
                const player = this.ui.create('player');
                player.initHero(hero);
                
                // item in tray
                const clone = this.ui.createElement('widget.avatar');
                this.ui.setImage(clone, hero);
                
                // add bindings
                this.ui.bind(clone, () => this.click(hero));
                this.ui.bind(player.node, () => this.click(hero));
                this.app.bindHero(player.node, hero);
                this.app.bindHero(clone, hero);

                // register nodes
                this.items.set(hero, player.node);
                this.clones.set(hero, clone);

                return player.node;
            });
        }

        // render all items to fill this.entries
        gallery.renderAll();
    }
}