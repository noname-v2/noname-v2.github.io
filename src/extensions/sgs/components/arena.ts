import type { Arena } from '../../../components';

export function arena(T: typeof Arena) {
    return class ArenaSGS extends T {
        /** Layout mode. */
        layout = 0;
    
        /** Player that is under control. */
        perspective = 0;
        
        /** Card container. */
        cards = this.ui.createElement('cards');
    
        /** Player container. */
        players = this.ui.createElement('players');

        /** Update arena layout. */
        resize(ax: number, ay: number, width: number, height: number) {
            // future: -> app.css['player-width'], etc.
            const np = this.get('np');
                
            if (np) {
                if (np >= 7 && width / height < (18 + (np - 1) * 168) / 720) {
                    // wide 2-row layout
                    [ax, ay] = [900, 755];
                    this.layout = 1;
                }
                else {
                    // normal 3-row layout
                    if (np === 8) {
                        ax = 1194;
                    }
                    else {
                        ax = 1026;
                    }
                    ay = 620;
                    this.layout = 0;
                }
            }
            console.log(ax, ay, width, height)
            return [ax, ay];
        }

        $np() {
            this.app.resize();
        }

        async $players(ids: number[]) {
            const nodes = new Set<HTMLElement>();

            // append players
            for (const id of ids) {
                const player = this.ui.get(id)!;
                nodes.add(player.node);
                if (player.node.parentNode !== this.players) {
                    this.players.appendChild(player.node);
                }
                if (player.mine) {
                    this.perspective = player.get('seat');
                }
            }

            // remove players that no longer exist
            for (const node of this.players.childNodes) {
                if (!nodes.has(node as HTMLElement)) {
                    node.remove();
                }
            }

            // append player region
            if (!this.players.parentNode) {
                this.node.appendChild(this.players);
            }
        }
    }
}