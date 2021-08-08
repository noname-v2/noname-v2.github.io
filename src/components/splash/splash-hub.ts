import { globals } from '../../client/globals';
import { Popup } from '../popup';
import { Splash, Dialog, SplashGallery } from '../../components';
import { config } from '../../version';
import { hub2member } from '../../hub/types';

export class SplashHub extends Popup {
    /** Portrait sized popup. */
    size = 'portrait' as const;

    /** Room widgets. */
    rooms = new Map<string, HTMLElement>();

    /** Number of online clients. */
    numSection!: HTMLElement;

    /** Room widget container. */
    roomGroup = this.ui.createElement('rooms.hidden');

    /** Caption container. */
    caption = this.ui.createElement('caption.hidden');

    /** Avatar image. */
    avatarImage!: HTMLElement; 

    /** nickname input */
    nickname = this.ui.create('input');

    /** address input */
    address = this.ui.create('input');

	/** Mode gallery for reference to extension index. */
    gallery!: SplashGallery;

    /** Popup for avatar selection. */
    avatarSelector: Popup | null = null;

    /** Called by app after UI loaded. */
    create() {
        // nickname, avatar and this address
        const splash = globals.splash;
        this.#addInfo();

		// room list in this menu
        this.numSection = this.pane.addSection('');
        this.numSection.classList.add('hidden');
		this.pane.node.appendChild(this.roomGroup);
        this.roomGroup.classList.add('scrolly');
		
		// caption message in this menu
		this.pane.node.appendChild(this.caption);

        // popup open and close
		this.onopen = () => {
			splash.node.classList.add('blurred');
			this.address.input.disabled = true;
			setTimeout(async () => {
				if (!globals.client.connection) {
					await this.#connect();
					this.address.input.disabled = false;
				}
			}, 500);
		};

		this.onclose = () => {
			splash.node.classList.remove('blurred');
            this.avatarSelector?.close();
		};

		// enable button click after creation finish
		splash.bar.buttons.get('hub')!.node.classList.remove('disabled');
        this.gallery = splash.gallery;
    }

    /** Disconnected or kicked out of room. */
    async reload(msg: string) {
        const [reason, content] = this.utils.split(msg);
        this.#clearRooms();
        this.edit(content);
        if (this.app.arena) {
            if (reason === 'kick') {
                await this.app.alert('你被请出了房间');
            }
            else if (reason === 'end') {
                await this.app.alert('房间已关闭');
            }
            this.app.arena.faded = true;
            globals.client.clear();
        }
        this.roomGroup.classList.remove('entering');
        this.roomGroup.classList.remove('hidden');
    }

    /** Room info update. */
    edit(msg: string) {
        const ws = globals.client.connection;
        if (!(ws instanceof WebSocket)) {
            return;
        }
        const rooms = JSON.parse(msg);
        for (const uid in rooms) {
            this.rooms.get(uid)?.remove();
            if (rooms[uid] !== 'close') {
                try {
                    const room = this.#createRoom(JSON.parse(rooms[uid]));
                    this.rooms.set(uid, room);
                    this.ui.bindClick(room, () => {
                        if (!this.roomGroup.classList.contains('entering')) {
                            this.roomGroup.classList.add('entering');
                            ws.send('join:' + uid);
                        }
                    });
                    this.roomGroup.appendChild(room);
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

    /** Online client number update. */
    num(msg: string) {
        this.numSection.classList.remove('hidden');
        (this.numSection.firstChild as HTMLElement).innerHTML = '在线：' + msg
    }

    /** Message received from the owner of joined room. */
    msg(msg: string) {
        globals.client.dispatch(JSON.parse(msg));
        if (!globals.splash.hidden) {
            globals.splash.hide(true);
            this.close();
        }
    }

    /** Owner of joined room disconnected. */
    down(msg: string) {
        const ws = globals.client.connection;
        const promise = this.app.alert('房主连接断开', {ok: '退出房间', id: 'down'});
        const dialog = this.app.popups.get('down') as Dialog;
        const update = () => {
            const remaining = Math.max(0, Math.round((parseInt(msg) - Date.now()) / 1000));
            dialog.set('content', `如果房主无法在<span class="mono">${remaining}</span>秒内重新连接，房间将自动关闭。`);
        };
        update();
        const interval = setInterval(update, 1000);
        promise.then(val => {
            clearInterval(interval);
            if (val === true && ws === globals.client.connection && ws instanceof WebSocket) {
                if (this.app.arena) {
                    this.app.arena.faded = true;
                    globals.client.clear();
                }
                ws.send('leave:init');
            }
        });
    }

    /** Connect to hub. */
    #connect() {
        try {
            if (!this.address.input.value) {
                this.db.set('ws', null);
                return;
            }
            globals.client.connect('wss://' + this.address.input.value);
            this.address.set('icon', 'clear');

            const ws = globals.client.connection as WebSocket;
            this.#setCaption('正在连接');

            return new Promise<void>(resolve => {
                ws.onclose = () => {
                    this.#disconnect(globals.client.connection === ws);
                    setTimeout(resolve, 100);
                };

                ws.onopen = () => {
                    this.address.set('icon', 'ok');
                    this.#setCaption('');
                    ws.send('init:' + JSON.stringify([globals.client.uid, globals.client.info]));
                    if (this.address.input.value !== config.ws) {
                        this.db.set('ws', this.address.input.value);
                    }
                };

                ws.onmessage = ({data}: {data: string}) => {
                    try {
                        const [method, arg] = this.utils.split<typeof hub2member[number]>(data);
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
            this.#disconnect(true);
        }
    }

    /** Disconnect from hub. */
    #disconnect(client: boolean) {
        if (client) {
            globals.client.disconnect();
        }
        this.#clearRooms();
        this.address.set('icon', null);
        this.#setCaption('已断开');
    }

    /** Remove room list. */
    #clearRooms() {
        for (const room of this.rooms.values()) {
            room.remove();
        }
        this.rooms.clear();
    }

    /** Show current connection status. */
    #setCaption(caption: string) {
        this.numSection.classList.add('hidden');
        this.roomGroup.classList.add('hidden');
        if (caption) {
            this.caption.innerHTML = caption;
        }
        this.caption.classList[caption ? 'remove' : 'add']('hidden');
    }

    /** Update nickname or avatar. */
    #sendInfo() {
        if (globals.client.connection instanceof WebSocket) {
            globals.client.connection.send('set:' + JSON.stringify(globals.client.info));
        }
    }

    /** Create a room entry. */
    #createRoom([name, np, npmax, [nickname, avatar], state]:
        [string, number, number, [string, string], boolean]) {
        const room = this.ui.createElement('widget');

        /** Avatar image. */
        const avatarNode = this.ui.createElement('image.avatar', room);
        this.ui.setImage(avatarNode, avatar);

        /** Mode name. */
        const captionNode = this.ui.createElement('caption', room);
        captionNode.innerHTML = name;

        /** Status text. */
        const statusNode = this.ui.createElement('span', room);
        const stateText = state ? '游戏中' : '等待中';
        statusNode.innerHTML = `<noname-status data-state="${state}"></noname-status> ${stateText} ${Math.min(np, npmax)} / ${npmax}`;

        /** Nickname text. */
        const nicknameNode = this.ui.createElement('span.nickname', room);
        nicknameNode.innerHTML = `<noname-image></noname-image>${nickname}`;

        return room;
    }

    /** Select avatar. */
    #createSelector() {
        const popup = this.avatarSelector = this.ui.create('popup');
        popup.node.classList.add('splash-avatar');
        popup.onopen = () => {
            this.node.classList.add('blurred');
            gallery.checkPage();
        };
        popup.onclose = () => {
            this.node.classList.remove('blurred');
        };
        const images = [];
        for (const name in this.gallery.index) {
            const ext = this.gallery.index[name];
            if (ext.images) {
                for (const img of ext.images) {
                    images.push(name + ':' + img);
                }
            }
        }
        const gallery = popup.pane.addGallery(5, 9);
        for (const img of images) {
            gallery.add(() => {
                const node = this.ui.createElement('image.avatar');
                this.ui.setImage(node, img);
                this.ui.bindClick(node, () => {
                    this.ui.setImage(this.avatarImage, img);
                    this.db.set('avatar', img);
                    this.#sendInfo();
                    popup.close();
                });
                return node;
            });
        }
    }

    /** Add avatar and input. */
    #addInfo() {
        const group = this.pane.add('group');

        // avatar
		const avatarNode = this.ui.createElement('widget', group);
		const img = this.avatarImage = this.ui.createElement('image.avatar', avatarNode);
		const url = this.db.get('avatar') ?? config.avatar;
        this.ui.setImage(img, url);
        this.ui.bindClick(avatarNode, () => {
            if (this.hidden) {
                return;
            }
            if (!this.avatarSelector) {
                this.#createSelector();
            }
            this.avatarSelector!.open();
        });

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
                this.#sendInfo();
			}
		};

        // address input
        this.ui.createElement('span.address', group).innerHTML = '地址';
		const address = this.address = this.ui.create('input', group);
		address.node.classList.add('address');
		address.ready.then(() => {
			address.input.value = this.app.ws;
		});
        address.callback = () => this.#connect();
        this.ui.bindClick(address.node, e => {
            const ws = globals.client.connection;
            if (address.input.disabled && ws instanceof WebSocket) {
                const menu = this.ui.create('popup');
                menu.position = e;
                menu.pane.addOption('断开', () => {
                    if (ws === globals.client.connection) {
                        ws.close();
                    }
                    menu.close();
                });
                menu.onclose = () => address.node.classList.remove('defer');
                address.node.classList.add('defer');
                menu.open();
            }
        });
    }
}