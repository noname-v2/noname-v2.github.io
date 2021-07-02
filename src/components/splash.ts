import { Component, PopupHub, PopupSettings, PopupMenu, Gallery, Button, Input } from '../components';
import { homepage } from '../version';

interface ExtensionIndex {
	[key: string]: {
		mode: string;
		pack: boolean;
		tags: string[];
	}
}

export class Splash extends Component {
    // gallery of modes
	gallery = <Gallery>this.ui.create('gallery');

	// bottom toolbar
	bar = this.ui.createElement('bar');

	// bottom toolbar buttons
	buttons = <{[key: string]: Button}>{};

	// settings menu
	settings = <PopupSettings>this.ui.create('popup-settings');

	// hub menu
	hub = <PopupHub>this.ui.create('popup-hub');

	private createModeEntry(mode: string, extensions: ExtensionIndex) {
        const ui = this.ui;
		const entry = ui.createElement('widget');
		const name = extensions[mode]['mode'];
		
		// set mode backgrround
		const bg = ui.createElement('image', entry);
		ui.setBackground(bg, 'extensions', mode, 'mode');
		
		// set caption
		const caption = ui.createElement('caption', entry);
		caption.innerHTML = name;

		// bind click
		ui.bindClick(entry, () => {
			const packs = [];

			for (const name in extensions) {
				let add = true;

				if (extensions[mode]['tags']) {
					for (const tag of extensions[mode]['tags']) {
						if (tag[tag.length-1] === '!') {
							if (!extensions[name]['tags'] || !extensions[name]['tags'].includes(tag)) {
								add = false;
								break;
							}
						}
					}
				}
				
				if (add && extensions[name]['tags']) {
					for (const tag of extensions[name]['tags']) {
						if (tag[tag.length-1] === '!') {
							if (!extensions[mode]['tags'] || !extensions[mode]['tags'].includes(tag)) {
								add = false;
								break;
							}
						}
					}
				}
				
				if (add && extensions[name].pack) {
					packs.push(name);
				}
			}

			this.client.connect([mode, packs]);
			this.hide();
		});

		return entry
	}

	private async createGallery() {
		const extensions = await this.client.readJSON<ExtensionIndex>('extensions/index.json');
		const modeNames = <{[key: string]: string}>{};
		const modes = <string[]>[];

		for (const name in extensions) {
			if (extensions[name]['mode']) {
				modeNames[name] = extensions[name]['mode'];
				modes.push(name);
			}
		}
		
		this.gallery.setup(1, 5, 900, true);

		for (let i = 0; i < modes.length; i += 5) {
			this.gallery.addPage(add => {
				for (let j = 0; j < 5; j++) {
					const mode = modes[i + j];
					if (mode) {
						add(this.createModeEntry(mode, extensions));
					}
				}
			});
		}
	}

    private createButton(caption: string, color: string, onclick: () => void) {
        const button = <Button>this.ui.create('button');
        button.update({ caption, color });
		button.node.classList.add('disabled');
        this.ui.bindClick(button.node, onclick);
        this.bar.appendChild(button.node);
		return button;
    }

	createHub() {
		const hub = this.hub;

		// nickname, avatar and hub address
		const group = this.ui.createElement('group');
		hub.pane.node.appendChild(group);

		// room list in hub menu
		const rooms = new Map<string, any>();
		const hubRooms = this.ui.createElement('rooms');
		hub.pane.node.appendChild(hubRooms);
		this.ui.enableScroll(hubRooms);

		const updateRooms = () => {
			if (rooms.size) {

			}
			else {
				setCaption('暂无房间');
			}
		};
		
		// caption message in hub menu
		const hubCaption = this.ui.createElement('caption.hidden');
		hub.pane.node.appendChild(hubCaption);
		
		const setCaption = (caption: string) => {
			hubRooms.classList.add('hidden');
			if (caption) {
				hubCaption.innerHTML = caption;
			}
			hubCaption.classList[caption ? 'remove' : 'add']('hidden');
		};

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

		// text
		this.ui.createElement('span.nickname', group).innerHTML = '昵称';
		this.ui.createElement('span.address', group).innerHTML = '地址';

		// input
		const nickname = <Input>this.ui.create('input', group);
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
		const address = <Input>this.ui.create('input', group);
		address.node.classList.add('address');
		address.ready.then(() => {
			address.input.value = this.db.get('ws') || `ws.${homepage}:8080`;
			address.input.disabled = true;
		});
		const resetConnection = () => {
			this.client.disconnect();
			rooms.clear();
			address.set('icon', null);
			address.onicon = null;
			setCaption('已断开');
		};
		const connect = address.callback = val => {
			if (val) {
				try {
					this.client.connect('wss://' + val);
					address.set('icon', 'clear');
					const ws = this.client.connection as WebSocket;
					setCaption('正在连接');
					return new Promise(resolve => {
						address.onicon = () => {
							ws.close();
						};
						ws.onclose = () => {
							resetConnection();
							setTimeout(resolve, 100);
						};
						ws.onopen = () => {
							address.set('icon', 'ok');
							setCaption('');
							const info = JSON.stringify([
								this.db.get('nickname') || '无名玩家',
								this.db.get('avatar') ?? 'standard:caocao'
							]);
							ws.send('init:' + JSON.stringify([this.client.uid, info]));
						};
						ws.onmessage = ({data}: {data: string}) => {
							try {
								if (data.startsWith('error:')) {
									ws.close();
								}
								else if (data.startsWith('update:')) {
									const updates = JSON.parse(data.slice(7));
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
					resetConnection();
				}
			}
		};

		hub.onopen = () => {
			this.node.classList.add('blurred');
			setTimeout(async () => {
				if (!this.client.connection) {
					await connect(address.input.value);
					address.input.disabled = false;
				}
			}, 500);
		};
		hub.onclose = () => {
			this.node.classList.remove('blurred');
		};

		// enable button click after creation finish
		this.buttons.hub.node.classList.remove('disabled');
	}
	
	init() {
		// create mode selection gallery
		this.createGallery();

		// reset game in debug mode
		if (this.client.debug) {
			this.createButton('重置', 'red', async () => {
				this.app.node.style.opacity = '0.5';
				
				if (window['caches']) {
					await window['caches'].delete(this.client.version);
				}

				for (const file of await this.db.readdir()) {
					if (file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.css')) {
						await this.db.writeFile(file, null);
					}
				}

				window.location.reload();
			}).node.classList.remove('disabled');
		}

		// create buttom buttons
        this.buttons.workshop = this.createButton('工坊', 'yellow', () => {
            console.log('yellow');
        });

        this.buttons.hub = this.createButton('联机', 'green', () => {
            this.hub.open();
        });

        this.buttons.settings = this.createButton('选项', 'orange', () => {
            this.settings.open();
        });

		this.node.appendChild(this.gallery.node);
        this.node.appendChild(this.bar);
	}

	hide() {
		this.ui.animate(this.node, {
			scale: [1, 'var(--app-splash-transform)'], opacity: [1, 0]
		}).onfinish = () => {
			this.node.remove();
		}
	}

	show() {
		this.app.node.appendChild(this.node);
		this.ui.animate(this.node, {
			scale: ['var(--app-splash-transform)', 1], opacity: [0, 1]
		});
	}
}