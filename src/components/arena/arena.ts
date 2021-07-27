import { Component } from '../../components';

export class Arena extends Component {
    /** Layout mode. */
    layout = 0;

    /** Player that is under control. */
    viewport = 0;

    /** Card container. */
    cards = this.ui.createElement('cards');

    /** Player container. */
    players = this.ui.createElement('players');

    /** A dialog has been popped before this.remove() is called. */
    faded = false;

    /** Trying to exit. */
    exiting = false;

    init() {
        this.app.arena = this;
        this.app.node.appendChild(this.node);

        // make android back button function as returning to splash screen
        if (this.client.platform === 'Android') {
            history.pushState('arena', '');
            this.client.listeners.history.add(this);
        }
    }

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

        return [ax, ay];
    }

    /** Remove arena. */
    remove() {
        super.remove(new Promise(resolve => {
            if (history.state === 'arena') {
                history.back();
            }
            this.ui.animate(this.node, {
                opacity: [this.faded ? 'var(--app-blurred-opacity)' : 1, 0]
            }).onfinish = resolve;
        }));
    }
    
    /** Back to splash screen. */
    back() {
        if (history.state === 'arena') {
            history.back();
        }
        else {
            this.#confirmBack();
        }
    }

    async history(state: string) {
        if (this.client.platform === 'Android' && state !== 'arena') {
            if (this.app.popups.has('exitArena')) {
                // close confirmation dialog when pressing back button twice
                this.app.removePopup('exitArena');
                history.forward();
            }
            else {
                this.#confirmBack();
            }
        }
    }

    /** Connection status change. */
    $peers() {
        if (!this.client.peers && this.exiting) {
            // worker notifies that room successfully closed
            this.client.disconnect();
        }
        else {
            // wait until other properties have been updated
            setTimeout(() => this.client.trigger('sync'));
        }
    }

    /** Confirm going back to splash screen. */
    async #confirmBack() {
        const ws = this.client.connection;
        const peers = this.client.peers;
        if (peers || ws instanceof WebSocket) {
            // postpond history back after user confirmation
            if (this.client.platform === 'Android') {
                history.forward();
            }

            const content = ws instanceof WebSocket ? '确定退出当前房间？': '当前房间有其他玩家，退出后将断开连接并请出所有其他玩家，确定退出当前模式？';
            if (!peers || peers.length <= 1 || await this.app.confirm('联机模式', {content, id: 'exitArena'})) {
                if (peers && peers.length > 1) {
                    this.faded = true;
                }
                if (ws instanceof WebSocket) {
                    // leave currently connected room
                    ws.send('leave:init');
                    this.client.clear();
                }
                else {
                    // tell worker to close the room
                    this.remove();
                    this.client.send(-2, null, false);
                    this.exiting = true;

                    // force exit if worker doesn't respond within 0.5s
                    setTimeout(() => {
                        if (this.exiting) {
                            this.client.disconnect();
                        }
                    }, 500);
                }
                
                // reset history.state when back to splash screen
                if (history.state === 'arena') {
                    this.client.listeners.history.delete(this);
                    history.back();
                }
            }
        }
        else {
            this.client.disconnect();
        }
    }
}