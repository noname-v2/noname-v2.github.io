import * as client from '../../client/client';
import { set } from '../../client/globals';
import { Component, Peer, Pop } from '../../components';

export class Arena extends Component {
    /** Set of all pops. */
    pops = new Set();

    /** A dialog has been popped before this.remove() is called. */
    faded = false;

    /** Confirming exit. */
    confirming = false;

    /** Trying to exit. */
    exiting = false;

    /** Control panel. */
    control = this.ui.create('control');

    /** Layer for swipe gesture to reveal control panel. */
    swipe = this.ui.createElement('layer.swipe', this.node);

    /** Layer for swipe gesture to reveal control panel. */
    main = this.ui.createElement('layer.main', this.node);

    /** Layer using arena zoom. */
    arenaZoom = this.ui.create('zoom');

    /** Layer using app zoom. */
    appZoom = this.ui.create('zoom');

    /** Layer containing control panel. */
    controlZoom = this.ui.create('zoom', this.node);

    /** Connected remote clients. */
    get peers(): Peer[] | null {
        const ids = this.data.peers;
        if (!ids) {
            return null;
        }

        const peers = [];
        for (const id of ids) {
            const cmp = this.getComponent(id);
            if (cmp) {
                peers.push(cmp as Peer);
            }
        }
        return peers;
    }

    /** Currently active zoom element. */
    get currentZoom() {
        if (!this.app.popups.size &&
            this.control.node.classList.contains('exclude') &&
            this.ui.countActive(this.arenaZoom.node) &&
            !this.ui.countActive(this.appZoom.node)) {
            return this.arenaZoom;
        }
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
        set('arena', this);
        this.main.appendChild(this.arenaZoom.node);
        this.main.appendChild(this.appZoom.node);
        this.app.node.insertBefore(this.node, this.app.zoomNode);

        // make android back button function as returning to splash screen
        if (this.platform.android && history.state === null) {
            history.pushState('arena', '');
        }

        // setup control panel
        this.control.ready.then(() => {
            this.controlZoom.node.appendChild(this.control.node);

            // setup swipe area
            let xmax = 0;
            let blocked = false;
            this.ui.bind(this.swipe, {
                movable: {x: [0, 220], y: [0, 0]},
                onmove: e => {
                    xmax = Math.max(xmax, e.x);
                    this.control.updateZoom(e.x);
                    return e.x;
                },
                onmoveend: x => {
                    if (!x || blocked) return;
                    blocked = true;
                    setTimeout(() => blocked = false, 200);
                    this.ui.moveTo(this.swipe, {x: 0, y: 0}, false);
                    if (xmax > 50 && x > xmax - 5) {
                        this.control.show(x);
                    }
                    else {
                        this.control.hide(x);
                    }
                    xmax = 0;
                },
                oncontext: () => {
                    if (blocked) return;
                    blocked = true;
                    xmax = 0;
                    setTimeout(() => blocked = false, 200);
                    this.control.show();
                }
            });
        });
    }

    /** Update arena layout (intended to be inherited by mode). */
    resize(ax: number, ay: number, width: number, height: number) {
        return [ax, ay];
    };

    /** Remove with fade out animation. */
    remove() {
        if (this.removing) {
            return;
        }
        
        if (this.app.arena === this) {
            set('arena', null);
            if (this.platform.android && history.state === 'arena') {
                history.back();
            }
        }
        super.remove(this.ui.animate(this.node, {
            opacity: [this.faded ? 'var(--app-blurred-opacity)' : 1, 0]
        }));
    }
    
    /** Back to splash screen. */
    async back() {
        if (this.confirming || this.exiting) {
            return;
        }
        this.confirming = true;
        const ws = client.connection;
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
                    client.clear();
                }
                else {
                    // tell worker to close the room
                    this.remove();
                    client.send(-2, null, false);
                    this.exiting = true;

                    // force exit if worker doesn't respond within 0.5s
                    setTimeout(() => {
                        if (this.exiting) {
                            client.disconnect();
                        }
                    }, 500);
                }
            }
            else {
                this.confirming = false;
            }
        }
        else {
            client.disconnect();
        }
    }

    /** Connection status change. */
    $peers() {
        if (!this.peers && this.exiting) {
            // worker notifies that room successfully closed
            client.disconnect();
        }
        else {
            // wait until other properties have been updated
            setTimeout(() => client.trigger('sync'));
        }
    }
}