import { Popup } from '../popup';
import { Splash, SplashRoom, Dialog } from '../../components';
import { config } from '../../version';
import { hub2member, split } from '../../hub/types';

export class SplashHub extends Popup {
    /** Use tag <noname-popup>. */
    static tag = 'popup';

    /** Portrait sized popup. */
    size = 'portrait' as const;

    /** Room widgets. */
    rooms = new Map<string, SplashRoom>();

    /** Number of online clients. */
    numSection!: HTMLElement;

    /** Room widget container. */
    roomGroup = this.ui.createElement('rooms.hidden');

    /** Caption container. */
    caption = this.ui.createElement('caption.hidden');

    /** nickname input */
    nickname = this.ui.create('input');

    /** address input */
    address = this.ui.create('input');

    create(splash: Splash) {
        // nickname, avatar and this address
        this.addInfo();

		// room list in this menu
        this.numSection = this.pane.addSection('');
        this.numSection.classList.add('hidden');
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
            room.remove();
        }
        this.rooms.clear();
    }

    setCaption(caption: string) {
        this.numSection.classList.add('hidden');
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
                this.address.onicon = () => {
                    ws.close();
                };

                ws.onclose = () => {
                    this.disconnect(this.client.connection === ws);
                    setTimeout(resolve, 100);
                };

                ws.onopen = () => {
                    this.address.set('icon', 'ok');
                    this.setCaption('');
                    ws.send('init:' + JSON.stringify([this.client.uid, this.client.info]));
                };

                ws.onmessage = ({data}: {data: string}) => {
                    try {
                        const [method, arg] = split<typeof hub2member[number]>(data);
                        if (hub2member.includes(method)) {
                            this[method](arg);
                        }
                    }
                    catch (e) {
                        console.log(e);
                        ws.close();
                    }
                };
            });
        }
        catch (e) {
            console.log(e);
            this.disconnect(true);
        }
    }

    disconnect(client: boolean) {
        if (client) {
            this.client.disconnect();
        }
        this.clearRooms();
        this.address.set('icon', null);
        this.address.onicon = null;
        this.setCaption('已断开');
    }

    addInfo() {
        const group = this.pane.add('group');

        // avatar
		const avatarNode = this.ui.createElement('widget', group);
		const img = this.ui.createElement('image', avatarNode);
		const url = this.db.get('avatar') ?? config.avatar;
		if (url.includes(':')) {
			const [ext, name] = url.split(':');
			this.ui.setBackground(img, 'extensions', ext, 'images', name);
		}
		else {
			this.ui.setBackground(img, url);
		}

		// nickname input
		this.ui.createElement('span.nickname', group).innerHTML = '昵称';
		const nickname = this.nickname = this.ui.create('input', group);
		nickname.node.classList.add('nickname');
		nickname.ready.then(() => {
            nickname.input.value = this.db.get('nickname') || config.nickname;
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
		const address = this.address = this.ui.create('input', group);
		address.node.classList.add('address');
		address.ready.then(() => {
			address.input.value = this.client.url;
		});
        address.callback = () => this.connect();
    }

    async reload(msg: string) {
        const [reason, content] = split(msg);
        if (reason === 'kick') {
            await this.app.alert('你被请出了房间');
        }
        else if (reason === 'end') {
            await this.app.alert('房间已关闭');
        }
        this.app.splash.show();
        this.roomGroup.classList.remove('entering');
        this.clearRooms();
        this.client.clear();
        this.roomGroup.classList.remove('hidden');
        this.edit(content);
    }

    edit(msg: string) {
        const ws = this.client.connection;
        if (!(ws instanceof WebSocket)) {
            return;
        }
        const rooms = JSON.parse(msg);
        for (const uid in rooms) {
            this.rooms.get(uid)?.remove();
            if (rooms[uid] !== 'close') {
                try {
                    const room = this.ui.create('splash-room');
                    room.setup(JSON.parse(rooms[uid]));
                    this.rooms.set(uid, room);
                    this.ui.bindClick(room.node, () => {
                        if (!this.roomGroup.classList.contains('entering')) {
                            this.roomGroup.classList.add('entering');
                            ws.send('join:' + uid);
                        }
                    });
                    this.roomGroup.appendChild(room.node);
                }
                catch (e) {
                    console.log(e);
                    this.rooms.delete(uid);
                }
            }
            else {
                this.rooms.delete(uid);
            }
        }
    }

    num(msg: string) {
        this.numSection.classList.remove('hidden');
        (this.numSection.firstChild as HTMLElement).innerHTML = '在线：' + msg
    }

    msg(msg: string) {
        this.client.dispatch(JSON.parse(msg));
        this.app.splash.hide();
        this.close();
    }

    down(msg: string) {
        // room owner disconnected
        const ws = this.client.connection;
        const promise = this.app.alert('房主连接断开', '退出房间', {id: 'down'});
        const dialog = <Dialog>this.app.popups.get('down');
        const update = () => {
            const remaining = Math.max(0, Math.round((parseInt(msg) - Date.now()) / 1000));
            dialog.set('content', `如果房主无法在<span class="mono">${remaining}</span>秒内重新连接，房间将自动关闭。`);
        };
        update();
        const interval = setInterval(update, 1000);
        promise.then(val => {
            clearInterval(interval);
            if (val === true && Object.is(ws, this.client.connection) && ws instanceof WebSocket) {
                ws.send('leave:init');
            }
        });
    }
}