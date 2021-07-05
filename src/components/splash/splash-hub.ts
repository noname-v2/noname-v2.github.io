import { Popup } from '../popup';
import { Splash, Input } from '../../components';
import { homepage } from '../../version';

export class SplashHub extends Popup {
    /** Use tag <noname-popup>. */
    static tag = 'popup';

    /** Portrait sized popup. */
    size = 'portrait' as const;

    /** Room widgets. */
    rooms = new Map<string, HTMLElement>();

    /** Room widget container. */
    roomGroup = this.ui.createElement('rooms.hidden');

    /** Caption container. */
    caption = this.ui.createElement('caption.hidden');

    /** nickname input */
    nickname = <Input>this.ui.create('input');

    /** address input */
    address = <Input>this.ui.create('input');

    /** Active connection that blocks address input. */
    addressBlocker: (() => void) | null = null;

    create(splash: Splash) {
        // nickname, avatar and this address
        this.addInfo();

		// room list in this menu
		this.pane.node.appendChild(this.roomGroup);
		this.ui.enableScroll(this.roomGroup);
		
		// caption message in this menu
		this.pane.node.appendChild(this.caption);

        // popup open and close
		this.onopen = () => {
			splash.node.classList.add('blurred');
			this.address.input.disabled = true;
			setTimeout(async () => {
				if (!this.client.connection) {
					await this.connect();
					this.address.input.disabled = false;
				}
			}, 500);
		};

		this.onclose = () => {
			splash.node.classList.remove('blurred');
		};

		// enable button click after creation finish
		splash.bar.buttons.hub.node.classList.remove('disabled');
    }

    clearRooms() {
        for (const room of this.rooms.values()) {
            
        }
    }

    updateRooms() {
        if (this.rooms.size) {
            this.roomGroup.classList.remove('hidden');
            this.caption.classList.add('hidden');
        }
        else {
            this.setCaption('暂无房间');
        }
    }

    setCaption(caption: string) {
        this.roomGroup.classList.add('hidden');
        if (caption) {
            this.caption.innerHTML = caption;
        }
        this.caption.classList[caption ? 'remove' : 'add']('hidden');
    }

    connect() {
        try {
            this.client.connect('wss://' + this.address.input.value);
            this.address.set('icon', 'clear');

            const ws = this.client.connection as WebSocket;
            this.setCaption('正在连接');

            return new Promise<void>(resolve => {
                this.addressBlocker = resolve;
                this.address.onicon = () => {
                    ws.close();
                };

                ws.onclose = () => this.disconnect();

                ws.onopen = () => {
                    this.address.set('icon', 'ok');
                    this.setCaption('');
                    ws.send('init:' + JSON.stringify([this.client.uid, [
                        this.db.get('nickname') || '无名玩家',
                        this.db.get('avatar') || 'standard:caocao'
                    ]]));
                };

                ws.onmessage = ({data}: {data: string}) => {
                    try {
                        if (data.startsWith('error:')) {
                            ws.close();
                        }
                        else if (data.startsWith('kicked:')) {

                        }
                        else if (data.startsWith('init:')) {
                            const updates = JSON.parse(data.slice(7));
                            this.clearRooms();
                            for (const uid in updates) {
                                if (typeof updates[uid] === 'number') {
                                    // rooms.get(uid)?[1] = updates[uid];
                                }
                            }
                        }
                    }
                    catch {
                        ws.close();
                    }
                };
            });
        }
        catch {
            this.disconnect();
        }
    }

    disconnect() {
        this.client.disconnect();
        this.clearRooms();
        this.address.set('icon', null);
        this.address.onicon = null;
        this.setCaption('已断开');

        if (this.addressBlocker) {
            setTimeout(this.addressBlocker, 100);
            this.addressBlocker = null;
        }
    }

    addInfo() {
        const group = this.ui.createElement('group');
		this.pane.node.appendChild(group);

        // avatar
		const avatarNode = this.ui.createElement('widget', group);
		const img = this.ui.createElement('image', avatarNode);
		const url = this.db.get('avatar') ?? 'standard:caocao';
		if (url.includes(':')) {
			const [ext, name] = url.split(':');
			this.ui.setBackground(img, 'extensions', ext, 'images', name);
		}
		else {
			this.ui.setBackground(img, url);
		}

		// nickname input
		this.ui.createElement('span.nickname', group).innerHTML = '昵称';
		const nickname = this.nickname = <Input>this.ui.create('input', group);
		nickname.node.classList.add('nickname');
		nickname.ready.then(() => {
            nickname.input.value = this.db.get('nickname') || '无名玩家';
		});
		nickname.callback = async val => {
            if (val) {
                this.db.set('nickname', val);
				nickname.set('icon', 'emote');
				await new Promise(resolve => setTimeout(resolve, this.app.getTransition('slow')));
				nickname.set('icon', null);
			}
		};

        // address input
        this.ui.createElement('span.address', group).innerHTML = '地址';
		const address = this.address = <Input>this.ui.create('input', group);
		address.node.classList.add('address');
		address.ready.then(() => {
			address.input.value = this.db.get('ws') || `ws.${homepage}:8080`;
		});
        address.callback = () => this.connect();
    }
}