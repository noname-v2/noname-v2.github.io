import type { Game } from './game';
import type { Link } from './link';

export class GameAccessor {
    #game: Game;
    
    /** All available heros. */
    heros = <string[]>[];

    /** All available cards. */
    cards = <string[]>[];

    /** Game defined properties. */
    [key: string]: any;

    constructor(game: Game) {
        this.#game = game;
    }
    
    get arena() {
        return this.#game.arena;
    }

    get mode() {
        return this.#game.mode;
    }

    get config() {
        return this.#game.config;
    }

    get packs() {
        return this.#game.packs;
    }

    get disabledHeropacks() {
        return this.#game.disabledHeropacks;
    }

    get disabledCardpacks() {
        return this.#game.disabledCardpacks;
    }

    get rootStage() {
        return this.#game.rootStage.accessor;
    }

    get activeStage() {
        return this.#game.activeStage?.accessor ?? null;
    }

    get links() {
        return this.#game.links;
    }

    get uid() {
        return this.#game.worker.uid;
    }

    /** Disallow changing configuration during game. */
    freeze() {
        this.#game.deepFreeze(this.#game.config);
        this.#game.deepFreeze(this.#game.packs);
        this.#game.deepFreeze(this.#game.disabledHeropacks);
        this.#game.deepFreeze(this.#game.disabledCardpacks);
    }

    /** Connect to remote hub. */
    connect(url: string) {
        this.#game.worker.connect(url);
    }

    /** Disconnect from remote hub. */
    disconnect() {
        this.#game.worker.disconnect();
    }

    /** Freeze config and tell hub about game start. */
    start() {
        if (this.#game.state === 0) {
            this.#game.state = 1;
            this.#game.worker.updateRoom();
        }
    }

    /** Mark game as ended. */
    over() {
        if (this.#game.state === 1) {
            this.#game.state = 0;
            this.#game.worker.updateRoom();
        }
    }

    /** Update client info. */
    updateRoom() {
        this.#game.worker.updateRoom();
    }

    /** Connected clients. */
    get peers() {
        if (this.#game.worker.peers) {
            return Array.from(this.#game.worker.peers.values());
        }
        return null;
    }

    /** Connected players. */
    get peerPlayers() {
        return this.#game.worker.getPeers({playing: true});
    }

    /** Connected spectators. */
    get peerSpectators() {
        return this.#game.worker.getPeers({playing: false});
    }
}