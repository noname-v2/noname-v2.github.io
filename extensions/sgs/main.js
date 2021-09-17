function loop(T) {
    return class Loop extends T {
        main() {
            console.log('loop');
        }
    };
}

function setup(T) {
    return class Setup extends T {
        main() {
            this.add('createPlayers');
            this.add('assignSeat');
            this.add('takeSeat');
            this.add('createCards');
        }
        /** Create all players and add to arena. */
        createPlayers() {
            for (let i = 0; i < this.arena.config.np; i++) {
                this.arena.create('player').data.seat = i;
            }
        }
        /** Assign clients to players. */
        assignSeat() {
            const players = this.arena.utils.rgets(this.arena.players.values(), this.arena.hub.players?.length || 1);
            const peers = this.arena.hub.players;
            for (const player of players) {
                if (peers?.length) {
                    const peer = peers.pop();
                    player.data.owner = peer.owner;
                    player.data.nickname = peer.data.nickname;
                }
                else {
                    if (!peers) {
                        player.data.owner = this.arena.owner;
                    }
                    break;
                }
            }
        }
        /** Update locations of players in arena. */
        takeSeat() {
            const ids = [];
            for (const player of this.arena.players.values()) {
                ids.push(player.id);
            }
            // use arena.update() instead of arena.data to skip type checking
            this.arena.update({
                players: ids,
                np: this.arena.config.np
            });
        }
        /** Create card pile. */
        createCards() {
        }
    };
}

function trigger(T) {
    return class Trigger extends T {
        /** Event name. */
        event;
        main() {
            // console.log('>', this.event, this.parent?.path)
        }
    };
}

const tasks = { loop, setup, trigger };

function player$1(P) {
    return class Player extends P {
        test() {
            // this.createPlayer();
        }
    };
}

function card(C) {
    return class Card extends C {
        test2() {
            // this.createPlayer();
        }
    };
}

function skill(S) {
    return class Skill extends S {
        test() {
            // this.createPlayer();
        }
    };
}

const links = {
    player: player$1, card, skill
};

function arena(T) {
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
        resize(ax, ay, width, height) {
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
                        // @ts-ignore
                        this.app.getComponent(id).$seat();
                    }
                });
            }
            return [ax, ay];
        }
        // get location of a seat
        locatePlayer(seat) {
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
                const xn = (n) => (150 + dx2) * n + dx1;
                const yn = (n) => (210 + dy) * n + dy * 2;
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
                    dx1 = 18;
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
                const xn0 = (n) => (150 + dx2) * n + dx1;
                const xn = (n) => (150 + dx3) * n + dx1;
                const yn = (n) => {
                    switch (n) {
                        case 0: return dy1;
                        case 1: return dy1 * 1.8;
                        case 2: return dy1 * 2 + dy2;
                        case 3: return dy1 * 2 + dy2 * 2 + 210;
                        case 4: return dy1 * 1.5 + dy2;
                        default: return 0;
                    }
                };
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
        async $players(ids) {
            const nodes = new Set();
            // append players
            for (const id of ids) {
                const player = this.app.getComponent(id);
                nodes.add(player.node);
                if (player.node.parentNode !== this.players) {
                    this.players.appendChild(player.node);
                    this.ui.animate(this.players, { opacity: [0, 1] });
                }
                if (player.mine) {
                    this.perspective = player.data.seat;
                }
            }
            // remove players that no longer exist
            for (const node of this.players.childNodes) {
                if (!nodes.has(node)) {
                    node.remove();
                }
            }
            // append player region
            if (!this.players.parentNode) {
                this.arenaZoom.node.appendChild(this.players);
                this.ui.animate(this.players, { scale: ['var(--app-zoom-scale)', 1] });
            }
        }
    };
}

function player(T) {
    return class Player extends T {
        x;
        y;
        locate(dx = 0, dy = 0) {
            this.node.style.transform = `translate(${this.x + dx}px,${this.y + dy}px)`;
        }
        $seat(seat) {
            seat ??= this.data.seat;
            // @ts-ignore
            [this.x, this.y] = this.app.arena.locatePlayer(seat);
            this.locate();
            if (!this.data.heroName) {
                this.$heroName(`@(${seat + 1})号位`);
            }
        }
    };
}

const components = { arena, player };

var main = {
    requires: ['standard', 'maneuver'],
    mode: {
        tasks,
        components,
        links,
        minHeroCount: 50,
        minPileCount: 100,
        autoKeywords: {
            hero: 'steel',
            card: 'gold',
            skill: 'orange'
        },
        config: {
            online: {
                name: '联机模式',
                intro: '允许其他玩家通过主页的联机键加入游戏。',
                init: false
            },
            timeout: {
                name: '出牌时限',
                init: 30,
                options: [
                    [15, '<span class="mono">15</span>秒'],
                    [30, '<span class="mono">30</span>秒'],
                    [60, '<span class="mono">1</span>分钟'],
                    [120, '<span class="mono">2</span>分钟']
                ],
                requires: 'online'
            },
            mulligan: {
                name: '手气卡',
                intro: '游戏开始时玩家可以更换一至两次手牌。',
                init: 0,
                options: [
                    [0, '禁用'],
                    [1, '一次'],
                    [2, '两次']
                ],
                requires: 'online'
            },
            infinite_mulligan: {
                name: '手气卡',
                intro: '游戏开始时玩家可以更换任意次手牌。',
                init: false,
                requires: '!online'
            },
            pick: {
                name: '点将',
                intro: '点击左侧武将包名称进行点将。可多选，优选择最左边的武将，若有多名玩家点同一武将导致点将失败，则会选择向右一名的武将，直到点将成功。',
                init: false,
                requires: 'online'
            },
            speed: {
                name: '游戏速度',
                intro: '控制游戏事件间的间隔时间。',
                init: 0.3,
                options: [
                    [0.5, '较慢'],
                    [0.3, '正常'],
                    [0.15, '较快']
                ]
            }
        }
    },
    lib: {
        faction: {
            'wei': ['魏', 'doger'],
            'shu': ['蜀', 'brown'],
            'wu': ['吴', 'green'],
            'qun': ['群', 'rod']
        },
        keyword: {
            '主公技': ['只有身份为主公时才可以发动', 'red'],
            '锁定技': ['技能于其发动时机若能发动则必须发动', 'sky'],
            '限定技': ['技能于一局游戏内只能发动一次', 'purple'],
            '觉醒技': ['① 技能于其发动时机若能发动则必须发动；② 技能于一局游戏内只能发动一次', 'aqua']
        },
        type: {
            'basic': '基本',
            'trick': '锦囊',
            'equip': '装备'
        },
        subtype: {
            'equip.weapon': '武器',
            'equip.armor': '防具',
            'equip.mount': '坐骑',
            'trick.instant': '普通锦囊',
            'trick.delayed': '延时锦囊'
        }
    }
};

export default main;
