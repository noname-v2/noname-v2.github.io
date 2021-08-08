import { globals } from '../../client/globals';
import { Component, Peer } from '../../components';

export class Arena extends Component {
    /** A dialog has been popped before this.remove() is called. */
    faded = false;

    /** Confirming exit. */
    confirming = false;

    /** Trying to exit. */
    exiting = false;

    /** Connected remote clients. */
    get peers(): Peer[] | null {
        const ids = this.get('peers');
        if (!ids) {
            return null;
        }

        const peers = [];
        for (const id of ids) {
            const cmp = this.ui.get(id);
            if (cmp) {
                peers.push(cmp as Peer);
            }
        }
        return peers;
    }

    /** Peer component representing current client. */
    get peer(): Peer | null {
        for (const peer of this.peers || []) {
            if (peer.mine) {
                return peer;
            }
        }
        return null;
    }

    init() {
        globals.arena = this;
        globals.app.node.appendChild(this.node);

        // make android back button function as returning to splash screen
        if (this.platform.android && history.state === null) {
            history.pushState('arena', '');
        }
    }

    /** Update arena layout (intended to be inherited by mode). */
    resize(ax: number, ay: number, width: number, height: number) {
        return [ax, ay];
    };

    /** Remove with fade out animation. */
    remove() {
        if (globals.arena === this) {
            delete globals.arena;
            if (this.platform.android && history.state === 'arena') {
                history.back();
            }
        }
        super.remove(new Promise(resolve => {
            this.ui.animate(this.node, {
                opacity: [this.faded ? 'var(--app-blurred-opacity)' : 1, 0]
            }).onfinish = resolve;
        }));
    }
    
    /** Back to splash screen. */
    async back() {
        if (this.confirming || this.exiting) {
            return;
        }
        this.confirming = true;
        const ws = globals.client.connection;
        const peers = this.peers;
        if (peers || ws instanceof WebSocket) {
            const content = ws instanceof WebSocket ? '确定退出当前房间？': '当前房间有其他玩家，退出后将断开连接并请出所有其他玩家，确定退出当前模式？';
            if (!peers || peers.length <= 1 || await this.app.confirm('联机模式', {content, id: 'exitArena'})) {
                if (peers && peers.length > 1) {
                    this.faded = true;
                }
                if (ws instanceof WebSocket) {
                    // leave currently connected room
                    ws.send('leave:init');
                    globals.client.clear();
                }
                else {
                    // tell worker to close the room
                    this.remove();
                    globals.client.send(-2, null, false);
                    this.exiting = true;

                    // force exit if worker doesn't respond within 0.5s
                    setTimeout(() => {
                        if (this.exiting) {
                            globals.client.disconnect();
                        }
                    }, 500);
                }
            }
            else {
                this.confirming = false;
            }
        }
        else {
            globals.client.disconnect();
        }
    }

    /** Connection status change. */
    $peers() {
        if (!this.peers && this.exiting) {
            // worker notifies that room successfully closed
            globals.client.disconnect();
        }
        else {
            // wait until other properties have been updated
            setTimeout(() => globals.client.trigger('sync'));
        }
    }
}