import { Component } from '../../components';

export class SplashRoom extends Component {
    /** Avatar image. */
    avatar = this.ui.createElement('image', this.node);

    /** Mode name. */
    caption = this.ui.createElement('caption', this.node);

    /** Status text. */
    status = this.ui.createElement('span', this.node);

    /** Nickname text. */
    nickname = this.ui.createElement('span.nickname', this.node);

    setup([name, np, npmax, [nickname, avatar], started]:
        [string, number, number, [string, string], boolean]) {
        if (avatar.includes(':')) {
            const [ext, name] = avatar.split(':');
            this.ui.setBackground(this.avatar, 'extensions', ext, 'images', name);
        }
        else {
            this.ui.setBackground(this.avatar, avatar);
        }

        this.caption.innerHTML = name;
        const state = started ? '游戏中' : '等待中';
        this.status.innerHTML = `<noname-status data-state="${started?1:0}"></noname-status> ${state} ${Math.min(np, npmax)} / ${npmax}`;
        this.nickname.innerHTML = `<noname-image></noname-image>${nickname}`;
    }
}