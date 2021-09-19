import * as client from '../../client/client';
import { setArena } from '../../client/globals';
import { Component, Peer, Popup } from '../../components/component';

export class Arena extends Component {
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

    /** Popup components cleared when arena close. */
    popups = new Set<HTMLElement>();

    /** Connected remote clients. */
    get peers(): Peer[] | null {
        const ids = this.data.peers;
        if (!ids) {
            return null;
        }

        const peers = [];
        for (const id of ids) {
            const cmp = this.app.getComponent(id);
            if (cmp) {
                peers.push(cmp as Peer);
            }
        }
        return peers;
    }

    /** Peer component representing current client. */
    get peer(): Peer | null {
        for (const id of this.data.peers ?? []) {
            const cmp = this.app.getComponent(id);
            if (cmp?.mine) {
                return cmp as Peer;
            }
        }
        return null;
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

    init() {
        setArena(this);
        this.main.appendChild(this.arenaZoom.node);
        this.main.appendChild(this.appZoom.node);
        this.app.node.insertBefore(this.node, this.app.zoomNode);

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
        if (this.removing) {
            return;
        }
        
        if (this.app.arena === this) {
            setArena(null);
            if (this.platform.android && history.state === 'arena') {
                history.back();
            }
        }
        super.remove(this.ui.animate(this.node, {
            opacity: [this.faded ? 'var(--app-blurred-opacity)' : 1, 0]
        }));
    }

    /** Display a popup. */
    async popup(dialog: Popup) {
        const onopen = dialog.onopen;
        const onclose = dialog.onclose;

        // other popups that are blurred by dialog.open()
        const blurred = new Set<HTMLElement>();

        dialog.onopen = () => {
            // blur arena, splash and other popups
            this.arenaZoom.node.classList.add('blurred');
            for (const popup of this.popups) {
                if (popup !== dialog.node && !popup.classList.contains('blurred')) {
                    popup.classList.add('blurred');
                    blurred.add(popup);
                }
            }

            if (typeof onopen === 'function') {
                onopen();
            }
        };

        dialog.onclose = () => {
            // unblur
            this.popups.delete(dialog.node);
            if (this.popups.size === 0) {
                this.arenaZoom.node.classList.remove('blurred');
            }
            for (const popup of blurred) {
                popup.classList.remove('blurred');
            }
            blurred.clear();

            if (typeof onclose === 'function') {
                onclose();
            }
        };

        this.popups.add(dialog.node);
        await dialog.ready;
        dialog.open();
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