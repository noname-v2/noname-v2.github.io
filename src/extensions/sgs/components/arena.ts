import type { Arena } from '../../../components';

export function arena(T: typeof Arena) {
    return class Arena extends T {
        /** Blur arena on start. */
        initBlur = true;

        /** Layout mode. */
        layout = 0;
    
        /** Player that is under control. */
        perspective = 0;
        
        /** Card container. */
        cards = this.ui.createElement('cards');
    
        /** Player container. */
        players = this.ui.createElement('players');

        init() {
            super.init();

            if (this.initBlur) {
                this.arenaZoom.node.classList.add('blurred');
            }
        }

        /** Update arena layout. */
        resize(ax: number, ay: number, width: number, height: number) {
            const np = this.data.np;
                
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

                // update player locations
                setTimeout(() => {
                    for (const id of this.data.players) {
                        this.getComponent(id)!.$seat();
                    }
                });
            }
            return [ax, ay];
        }

        // get location of a seat
        locatePlayer(seat: number) {
            // actual seat considering viewport
            const np = this.data.np;
            seat -= this.perspective;
            if (seat < 0) {
                seat += np;
            }
    
            const width = this.arenaZoom.width;
            const height = this.arenaZoom.height;
    
            if (this.layout === 1) {
                let dx1 = 25;
                let dx2 = (width - dx1 * 2 - 150 * (np - 3)) / (np - 4);
                if (dx2 < dx1) {
                    dx1 = dx2 = (width - 150 * (np - 3)) / (np - 2);
                }
                const dy = (height - 630) / 5;
                const xn = (n: number) => (150 + dx2) * n + dx1;
                const yn = (n: number) => (210 + dy) * n + dy * 2;
                if (np === 8) {
                    switch (seat) {
                        case 0: return [xn(0), yn(2)];
                        case 1: return [xn(4), yn(1)];
                        case 2: return [xn(4), yn(0)];
                        case 3: return [xn(3), dy];
                        case 4: return [xn(2), dy];
                        case 5: return [xn(1), dy];
                        case 6: return [xn(0), yn(0)];
                        case 7: return [xn(0), yn(1)];
                    }
                }
                else {
                    switch (seat) {
                        case 0: return [xn(0), yn(2)];
                        case 1: return [xn(3), yn(1)];
                        case 2: return [xn(3), yn(0)];
                        case 3: return [xn(2), dy];
                        case 4: return [xn(1), dy];
                        case 5: return [xn(0), yn(0)];
                        case 6: return [xn(0), yn(1)];
                    }
                }
            }
            else {
                let dx1 = 18;
                let dx2 = (width - dx1 * 2 - 1050) / 6;
                if (dx2 < dx1) {
                    dx1 = dx2 = (width - 1050) / 8;
                }
                if (np < 8) {
                    dx1 = 18
                    dx2 = (width - dx1 * 2 - 900) / 5;
                    if (dx2 < dx1) {
                        dx1 = dx2 = (width - 900) / 7;
                    }
                }
                const dx3 = (width - dx1 * 2 - 150 * (np - 1)) / (np - 2);
                let dy1 = dx1;
                let dy2 = (height - dy1 * 3 - 420) / 2;
                if (dy2 <= 0 || dy1 / dy2 > 18 / 73) {
                    dy1 = (height - 420) / 200 * 18;
                    dy2 = (height - 420) / 200 * 73;
                }
                const xn0 = (n: number) => (150 + dx2) * n + dx1;
                const xn = (n: number) => (150 + dx3) * n + dx1;
                const yn = (n: number) => {
                    switch (n) {
                        case 0: return dy1;
                        case 1: return dy1 * 1.8;
                        case 2: return dy1 * 2 + dy2;
                        case 3: return dy1 * 2 + dy2 * 2 + 210;
                        case 4: return dy1 * 1.5 + dy2
                        default: return 0;
                    }
                }
                switch (np) {
                    case 8: {
                        switch (seat) {
                            case 0: return [xn0(0), yn(3)];
                            case 1: return [xn0(6), yn(2)];
                            case 2: return [xn0(5), yn(1)];
                            case 3: return [xn0(4), yn(0)];
                            case 4: return [xn0(3), yn(0)];
                            case 5: return [xn0(2), yn(0)];
                            case 6: return [xn0(1), yn(1)];
                            case 7: return [xn0(0), yn(2)];
                        }
                    }
                    case 7: {
                        switch (seat) {
                            case 0: return [xn(0), yn(3)];
                            case 1: return [xn(5), yn(2)];
                            case 2: return [xn(4), yn(1)];
                            case 3: return [xn(3), yn(0)];
                            case 4: return [xn(2), yn(0)];
                            case 5: return [xn(1), yn(1)];
                            case 6: return [xn(0), yn(2)];
                        }
                    }
                    case 6: {
                        switch (seat) {
                            case 0: return [xn(0), yn(3)];
                            case 1: return [xn(4), yn(4)];
                            case 2: return [xn(3), yn(0)];
                            case 3: return [xn(2), yn(0)];
                            case 4: return [xn(1), yn(0)];
                            case 5: return [xn(0), yn(4)];
                        }
                    }
                    case 5: {
                        switch (seat) {
                            case 0: return [xn(0), yn(3)];
                            case 1: return [xn(3), yn(4)];
                            case 2: return [xn(2), yn(0)];
                            case 3: return [xn(1), yn(0)];
                            case 4: return [xn(0), yn(4)];
                        }
                    }
                    case 4: {
                        switch (seat) {
                            case 0: return [xn(0), yn(3)];
                            case 1: return [xn(2), yn(4)];
                            case 2: return [xn(1), yn(0)];
                            case 3: return [xn(0), yn(4)];
                        }
                    }
                    case 3: {
                        switch (seat) {
                            case 0: return [dx1, yn(3)];
                            case 1: return [width - dx1 - 150, yn(2)];
                            case 2: return [width / 2.5 - 150, yn(0)];
                        }
                    }
                    case 2: {
                        switch (seat) {
                            case 0: return [dx1, yn(3)];
                            case 1: return [width / 2 - 75, yn(0)];
                        }
                    }
                }
            }
            return [0, 0];
        }

        $np() {
            this.app.resize();
        }

        async $players(ids: number[]) {
            const nodes = new Set<HTMLElement>();

            // append players
            for (const id of ids) {
                const player = this.getComponent(id)!;
                nodes.add(player.node);
                if (player.node.parentNode !== this.players) {
                    this.players.appendChild(player.node);
                    this.ui.animate(this.players, {opacity: [0, 1]});
                }
                if (player.mine) {
                    this.perspective = player.data.seat;
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
                this.arenaZoom.node.appendChild(this.players);
                this.ui.animate(this.players, {scale: ['var(--app-zoom-scale)', 1]})
            }
        }
    }
}