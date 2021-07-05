import type { CollectionSGS } from '../sgs';

export const game = <CollectionSGS>{
    init: {
        content() {
            this.add('createArena');
            this.add('createLobby');
            this.add('createGame');
        },
        contents: {
            createArena() {
                this.game.arena = this.create('arena');
            },
            createLobby() {
                const lobby = this.create('lobby');
                const heropacks = {} as any;
                const cardpacks = {} as any;
                const configs = {} as any;
                for (const name of this.game.packs) {
                    const heropack = this.getRule(name, 'heropack');
                    const cardpack = this.getRule(name, 'cardpack');
                    if (heropack) {
                        heropacks[name] = heropack;
                    }
                    if (cardpack) {
                        cardpacks[name] = cardpack;
                    }
                }
                const fullConfigs = this.getRule('#config');
                for (const name in fullConfigs) {
                    configs[name] = {};
                    configs[name].name = fullConfigs[name].name;
                    configs[name].intro = fullConfigs[name].intro;
                    configs[name].options = fullConfigs[name].options;
                    configs[name].requires = fullConfigs[name].requires;
                    configs[name].confirm = fullConfigs[name].confirm;

                    if (!(name in this.game.config)) {
                        this.game.config[name] = fullConfigs[name].init;
                    }
                }
                lobby.set('pane', {heropacks, cardpacks, configs});
                this.add('awaitStart').lobbyID = lobby.id;
            },
            awaitStart() {
                const lobby = this.game.links.get(this.lobbyID)!;
                lobby.owner = this.game.uid;
                lobby.set('mode', this.game.mode);
                lobby.set('config', this.game.config);
                lobby.set('disabledHeropacks', Array.from(this.game.disabledHeropacks));
                lobby.set('disabledCardpacks', Array.from(this.game.disabledCardpacks));
                lobby.monitor('updateLobby');
            },
            updateLobby(lobby, [type, key, val]: [string, string, any]) {
                if (type === 'config') {
                    this.game.config[key] = val;
                    lobby.set('config', this.game.config);
                }
                else if (type === 'hero') {
                    this.game.disabledHeropacks[val ? 'delete' : 'add'](key);
                    lobby.set('disabledHeropacks', Array.from(this.game.disabledHeropacks));
                }
                else if (type === 'card') {
                    this.game.disabledCardpacks[val ? 'delete' : 'add'](key);
                    lobby.set('disabledCardpacks', Array.from(this.game.disabledCardpacks));
                }
            },
            createGame() {
                
            }
        }
    },
    chooseHero: {
        content() {
            console.log('chooseHero');
        }
    },
    loop: {
        content() {
            console.log('loop');
        }
    }
}