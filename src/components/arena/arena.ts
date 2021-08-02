import { Component } from '../../components';

export class Arena extends Component {
    /** A dialog has been popped before this.remove() is called. */
    faded = false;

    /** Confirming exit. */
    confirming = false;

    /** Trying to exit. */
    exiting = false;

    init() {
        this.app.arena = this;
        this.app.node.appendChild(this.node);

        // make android back button function as returning to splash screen
        if (this.client.platform === 'Android' && history.state === null) {
            history.pushState('arena', '');
        }
    }

    /** Update arena layout (intended to be inherited by mode). */
    resize(ax: number, ay: number, width: number, height: number) {
        return [ax, ay];
    };

    /** Remove with fade out animation. */
    remove() {
        if (this.app.arena === this) {
            this.app.arena = null;
            if (this.client.platform === 'Android' && history.state === 'arena') {
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
        const ws = this.client.connection;
        const peers = this.client.peers;
        if (peers || ws instanceof WebSocket) {
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
            }
            else {
                this.confirming = false;
            }
        }
        else {
            this.client.disconnect();
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
}